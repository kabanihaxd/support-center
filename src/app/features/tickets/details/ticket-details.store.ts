import { computed, inject, Injectable, signal } from '@angular/core';
import { errorMessage } from '@core/errors/app-error';
import { TicketService } from '@core/services/ticket.service';
import { ToastService } from '@core/services/toast.service';
import { UserDirectory } from '@core/services/user-directory.service';
import { Comment, Ticket, TicketEvent, TicketPriority, TicketStatus } from '@shared/models';

export type DetailsAction = 'status' | 'priority' | 'assignee' | 'comment' | 'delete';

/** Состояние страницы тикета. Предоставляется на уровне компонента страницы */
@Injectable()
export class TicketDetailsStore {
  private readonly tickets = inject(TicketService);
  private readonly users = inject(UserDirectory);
  private readonly toast = inject(ToastService);

  private readonly id = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly comments = signal<Comment[]>([]);
  readonly events = signal<TicketEvent[]>([]);
  readonly activityLoading = signal(true);
  /** Выполняющиеся действия. Каждое блокирует только свой контрол — независимые действия идут параллельно */
  private readonly running = signal<ReadonlySet<DetailsAction>>(new Set());
  readonly anyBusy = computed(() => this.running().size > 0);

  isBusy(action: DetailsAction): boolean {
    return this.running().has(action);
  }

  /** Берём тикет из общего кэша — изменения из любого места сразу видны здесь */
  readonly ticket = computed(() => this.tickets.tickets().find((t) => t.id === this.id()) ?? null);
  readonly notFound = computed(() => !this.loading() && !this.error() && !this.ticket());

  async load(id: string): Promise<void> {
    this.id.set(id);
    this.loading.set(true);
    this.error.set(null);
    try {
      await Promise.all([this.tickets.load(), this.users.load()]);
      const loadError = this.tickets.error();
      if (loadError) this.error.set(loadError);
    } catch (e) {
      this.error.set(errorMessage(e, 'Could not load the ticket.'));
    } finally {
      this.loading.set(false);
    }
    // Комментарии и история догружаются отдельно, со своими скелетонами
    if (this.ticket()) {
      this.comments.set([]);
      this.events.set([]);
      await this.loadActivity().catch(() => this.toast.error('Could not load comments and history.'));
    }
  }

  async loadActivity(): Promise<void> {
    const id = this.id();
    if (!id) return;
    this.activityLoading.set(true);
    try {
      const [comments, events] = await Promise.all([this.tickets.listComments(id), this.tickets.listEvents(id)]);
      this.comments.set(comments);
      this.events.set(events);
    } finally {
      this.activityLoading.set(false);
    }
  }

  changeStatus(status: TicketStatus, successMessage?: string): Promise<boolean> {
    return this.run('status', (t) => this.tickets.changeStatus(t, status), successMessage ?? 'Status updated.');
  }

  changePriority(priority: TicketPriority): Promise<boolean> {
    return this.run('priority', (t) => this.tickets.changePriority(t, priority), 'Priority updated.');
  }

  assign(assigneeId: string | null): Promise<boolean> {
    const message = assigneeId ? `Assigned to ${this.users.name(assigneeId)}.` : 'Ticket unassigned.';
    return this.run('assignee', (t) => this.tickets.assign(t, assigneeId), message);
  }

  addComment(body: string, internal: boolean): Promise<boolean> {
    return this.run(
      'comment',
      async (t) => {
        const comment = await this.tickets.addComment(t, body, internal);
        // Показываем сразу, не дожидаясь перезагрузки ленты
        this.comments.update((list) => [...list, comment]);
      },
      internal ? 'Internal note added.' : 'Comment posted.',
    );
  }

  delete(): Promise<boolean> {
    return this.run('delete', (t) => this.tickets.delete(t), 'Ticket deleted.', false);
  }

  /** Общая обёртка: блокировка, toast об успехе/ошибке, обновление истории */
  private async run(
    action: DetailsAction,
    fn: (ticket: Ticket) => Promise<unknown>,
    successMessage: string,
    refreshActivity = true,
  ): Promise<boolean> {
    const ticket = this.ticket();
    if (!ticket || this.isBusy(action)) return false;
    this.running.update((set) => new Set(set).add(action));
    try {
      await fn(ticket);
      this.toast.success(successMessage);
      // История догружается в фоне — действие не ждёт её
      if (refreshActivity) void this.loadActivity().catch(() => undefined);
      return true;
    } catch (e) {
      this.toast.error(errorMessage(e));
      return false;
    } finally {
      this.running.update((set) => {
        const next = new Set(set);
        next.delete(action);
        return next;
      });
    }
  }
}
