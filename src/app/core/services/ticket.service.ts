import { computed, inject, Service, signal } from '@angular/core';
import { canCloseOrReopen, canEditTicket, canViewTicket, hasPermission, Permission } from '@core/auth/permissions';
import { CommentRepository, TicketEventRepository, TicketRepository } from '@core/data/repositories';
import { dueDateFor, priorityPatch, statusPatch } from '@core/domain/ticket-rules';
import { AppError, errorMessage } from '@core/errors/app-error';
import {
  Comment,
  STATUS_LABELS,
  Ticket,
  TicketCategory,
  TicketEvent,
  TicketEventType,
  TicketPriority,
  TicketStatus,
  User,
} from '@shared/models';
import { AuthService } from './auth.service';
import { Clock } from './clock';
import { NotificationService } from './notification.service';

export interface TicketDraft {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  /** Сотрудник создаёт тикет от имени клиента; клиент — всегда от себя */
  customerId?: string;
  assigneeId?: string | null;
}

/** Тикеты: загрузка, права, изменения, история и уведомления */
@Service()
export class TicketService {
  private readonly repo = inject(TicketRepository);
  private readonly commentsRepo = inject(CommentRepository);
  private readonly eventsRepo = inject(TicketEventRepository);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly clock = inject(Clock);

  private readonly all = signal<Ticket[]>([]);
  private pending: Promise<void> | null = null;
  /** Для кого загружен кэш: id клиента или 'staff' (сотрудники видят всё) */
  private readonly loadedFor = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly loaded = computed(() => this.loadedFor() !== null && this.loadedFor() === this.scopeKey());

  /** Тикеты, доступные текущему пользователю (повторная проверка прав — на всякий случай) */
  readonly tickets = computed(() => {
    const user = this.auth.user();
    return user && this.loaded() ? this.all().filter((t) => canViewTicket(user, t)) : [];
  });

  private readonly scopeKey = computed(() => {
    const user = this.auth.user();
    if (!user) return null;
    return hasPermission(user.role, 'ticket.viewAll') ? 'staff' : user.id;
  });

  load(force = false): Promise<void> {
    const key = this.scopeKey();
    if (!key) return Promise.resolve();
    if (this.loaded() && !force) return Promise.resolve();
    if (this.pending) return this.pending;
    this.loading.set(true);
    this.error.set(null);
    // Клиент запрашивает только свои тикеты (так же будут работать правила Firestore)
    const request = key === 'staff' ? this.repo.list() : this.repo.listByCustomer(key);
    this.pending = request
      .then((list) => {
        this.all.set(list);
        this.loadedFor.set(key);
      })
      .catch((e: unknown) => this.error.set(errorMessage(e, 'Could not load tickets.')))
      .finally(() => {
        this.loading.set(false);
        this.pending = null;
      });
    return this.pending;
  }

  /** null — тикета нет или нет доступа (для пользователя одинаково: «не найден») */
  async getById(id: string): Promise<Ticket | null> {
    await this.load();
    return this.tickets().find((t) => t.id === id) ?? null;
  }

  async create(draft: TicketDraft): Promise<Ticket> {
    const user = this.requireUser();
    this.require(user, 'ticket.create');
    const isStaff = hasPermission(user.role, 'ticket.viewAll');
    const customerId = isStaff ? draft.customerId : user.id;
    if (!customerId) throw new AppError('validation', 'Please select a customer.');
    const assigneeId = isStaff && hasPermission(user.role, 'ticket.assign') ? (draft.assigneeId ?? null) : null;
    const now = this.clock.nowIso();

    const ticket = await this.repo.create({
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      priority: draft.priority,
      status: 'open',
      customerId,
      assigneeId,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      dueAt: dueDateFor(now, draft.priority),
    });
    this.all.update((list) => [...list, ticket]);
    await Promise.all([
      this.record(ticket.id, 'created', null, null),
      assigneeId && this.record(ticket.id, 'assignee', null, assigneeId),
      assigneeId && this.notifications.notify(assigneeId, 'assigned', ticket.id, `${ticket.id} was assigned to you`),
      customerId !== user.id &&
        this.notifications.notify(customerId, 'status', ticket.id, `${ticket.id} was created on your behalf`),
    ]);
    return ticket;
  }

  /** Редактирование из формы: текст, категория, приоритет, исполнитель */
  async update(ticket: Ticket, draft: TicketDraft): Promise<Ticket> {
    const user = this.requireUser();
    if (!canEditTicket(user, ticket)) throw this.forbidden();
    const isStaff = hasPermission(user.role, 'ticket.viewAll');

    const textChanged =
      draft.title.trim() !== ticket.title ||
      draft.description.trim() !== ticket.description ||
      draft.category !== ticket.category;
    let updated = ticket;
    if (textChanged) {
      [updated] = await Promise.all([
        this.patch(ticket.id, {
          title: draft.title.trim(),
          description: draft.description.trim(),
          category: draft.category,
          updatedAt: this.clock.nowIso(),
        }),
        this.record(ticket.id, 'edited', null, null),
      ]);
    }
    if (draft.priority !== ticket.priority && (isStaff || ticket.status === 'open')) {
      updated = await this.applyPriority(updated, draft.priority);
    }
    if (isStaff && draft.assigneeId !== undefined && draft.assigneeId !== ticket.assigneeId) {
      updated = await this.assign(updated, draft.assigneeId);
    }
    return updated;
  }

  async changeStatus(ticket: Ticket, status: TicketStatus): Promise<Ticket> {
    const user = this.requireUser();
    const allowed = hasPermission(user.role, 'ticket.changeStatus') || this.isCustomerCloseOrReopen(user, ticket, status);
    if (!allowed) throw this.forbidden();
    if (status === ticket.status) return ticket;

    const updated = await this.patch(ticket.id, statusPatch(ticket, status, this.clock.nowIso()));
    const message = `${ticket.id} is now ${STATUS_LABELS[status]}`;
    // История и уведомления — параллельно, чтобы действие не «висело»
    await Promise.all([
      this.record(ticket.id, 'status', ticket.status, status),
      user.id !== ticket.customerId && this.notifications.notify(ticket.customerId, 'status', ticket.id, message),
      ticket.assigneeId &&
        user.id !== ticket.assigneeId &&
        this.notifications.notify(ticket.assigneeId, 'status', ticket.id, message),
    ]);
    return updated;
  }

  async changePriority(ticket: Ticket, priority: TicketPriority): Promise<Ticket> {
    this.require(this.requireUser(), 'ticket.changePriority');
    return this.applyPriority(ticket, priority);
  }

  async assign(ticket: Ticket, assigneeId: string | null): Promise<Ticket> {
    this.require(this.requireUser(), 'ticket.assign');
    if (assigneeId === ticket.assigneeId) return ticket;
    const updated = await this.patch(ticket.id, { assigneeId, updatedAt: this.clock.nowIso() });
    await Promise.all([
      this.record(ticket.id, 'assignee', ticket.assigneeId, assigneeId),
      assigneeId && this.notifications.notify(assigneeId, 'assigned', ticket.id, `${ticket.id} was assigned to you`),
    ]);
    return updated;
  }

  async delete(ticket: Ticket): Promise<void> {
    this.require(this.requireUser(), 'ticket.delete');
    await this.repo.delete(ticket.id);
    await Promise.all([
      this.commentsRepo.deleteByTicket(ticket.id),
      this.eventsRepo.deleteByTicket(ticket.id),
    ]);
    this.all.update((list) => list.filter((t) => t.id !== ticket.id));
    this.notifications.forgetTicket(ticket.id);
  }

  /** Комментарии; внутренние заметки клиент не видит */
  async listComments(ticketId: string): Promise<Comment[]> {
    const user = this.requireUser();
    const comments = await this.commentsRepo.listByTicket(ticketId);
    return comments
      .filter((c) => !c.internal || hasPermission(user.role, 'comment.internal'))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listEvents(ticketId: string): Promise<TicketEvent[]> {
    const user = this.requireUser();
    const events = await this.eventsRepo.listByTicket(ticketId);
    return events
      .filter((e) => !(e.type === 'comment' && e.to === 'internal') || hasPermission(user.role, 'comment.internal'))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addComment(ticket: Ticket, body: string, internal: boolean): Promise<Comment> {
    const user = this.requireUser();
    if (!canViewTicket(user, ticket)) throw this.forbidden();
    if (internal) this.require(user, 'comment.internal');
    const text = body.trim();
    if (!text) throw new AppError('validation', 'Comment cannot be empty.');

    const comment = await this.commentsRepo.create({
      ticketId: ticket.id,
      authorId: user.id,
      body: text,
      createdAt: this.clock.nowIso(),
      internal,
    });
    const message = `New reply on ${ticket.id}`;
    await Promise.all([
      this.record(ticket.id, 'comment', null, internal ? 'internal' : null),
      this.patch(ticket.id, { updatedAt: comment.createdAt }),
      !internal &&
        user.id !== ticket.customerId &&
        this.notifications.notify(ticket.customerId, 'comment', ticket.id, message),
      !internal &&
        ticket.assigneeId &&
        user.id !== ticket.assigneeId &&
        this.notifications.notify(ticket.assigneeId, 'comment', ticket.id, message),
    ]);
    return comment;
  }

  private async applyPriority(ticket: Ticket, priority: TicketPriority): Promise<Ticket> {
    if (priority === ticket.priority) return ticket;
    const [updated] = await Promise.all([
      this.patch(ticket.id, priorityPatch(ticket, priority, this.clock.nowIso())),
      this.record(ticket.id, 'priority', ticket.priority, priority),
    ]);
    return updated;
  }

  /** Клиент может только закрыть свой тикет или переоткрыть его */
  private isCustomerCloseOrReopen(user: User, ticket: Ticket, status: TicketStatus): boolean {
    if (!canCloseOrReopen(user, ticket)) return false;
    const reopening = (ticket.status === 'resolved' || ticket.status === 'closed') && status === 'open';
    return status === 'closed' || reopening;
  }

  private async patch(id: string, patch: Partial<Omit<Ticket, 'id'>>): Promise<Ticket> {
    const updated = await this.repo.update(id, patch);
    this.all.update((list) => list.map((t) => (t.id === id ? updated : t)));
    return updated;
  }

  private async record(ticketId: string, type: TicketEventType, from: string | null, to: string | null): Promise<void> {
    await this.eventsRepo.create({
      ticketId,
      actorId: this.requireUser().id,
      type,
      from,
      to,
      createdAt: this.clock.nowIso(),
    });
  }

  private requireUser(): User {
    const user = this.auth.user();
    if (!user) throw new AppError('unauthorized', 'Please sign in again.');
    return user;
  }

  private require(user: User, permission: Permission): void {
    if (!hasPermission(user.role, permission)) throw this.forbidden();
  }

  private forbidden(): AppError {
    return new AppError('forbidden', "You don't have permission to perform this action.");
  }
}
