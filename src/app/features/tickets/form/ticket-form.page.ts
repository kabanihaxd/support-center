import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { form, FormField, FormRoot, maxLength, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { canEditTicket } from '@core/auth/permissions';
import { errorMessage } from '@core/errors/app-error';
import { AuthService } from '@core/services/auth.service';
import { ConfirmService } from '@core/services/confirm.service';
import { TicketDraft, TicketService } from '@core/services/ticket.service';
import { ToastService } from '@core/services/toast.service';
import { UserDirectory } from '@core/services/user-directory.service';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { FieldErrors } from '@shared/components/field-errors/field-errors';
import { Icon } from '@shared/components/icon/icon';
import { PageHeader } from '@shared/components/page-header/page-header';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SLA_HOURS,
  Ticket,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TicketCategory,
  TicketPriority,
} from '@shared/models';
import { formatDuration } from '@shared/utils/dates';

interface TicketFormModel {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  customerId: string;
  assigneeId: string;
}

type PageState = 'loading' | 'ready' | 'not-found' | 'forbidden';

/** Создание (/tickets/new) и редактирование (/tickets/:id/edit) тикета */
@Component({
  selector: 'app-ticket-form-page',
  imports: [RouterLink, FormField, FormRoot, FieldErrors, Icon, PageHeader, EmptyState],
  templateUrl: './ticket-form.page.html',
  styleUrl: './ticket-form.page.css',
})
export class TicketFormPage implements OnInit {
  private readonly tickets = inject(TicketService);
  protected readonly users = inject(UserDirectory);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  /** id из маршрута :id — режим редактирования */
  readonly id = input<string>();
  /** ?customer= — предвыбор клиента при создании из его профиля */
  readonly customer = input<string>();

  protected readonly state = signal<PageState>('loading');
  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly serverError = signal<string | null>(null);
  private saved = false;

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly isStaff = computed(() => this.auth.can('ticket.viewAll'));
  protected readonly canAssign = computed(() => this.auth.can('ticket.assign'));
  protected readonly categories = TICKET_CATEGORIES;
  protected readonly priorities = TICKET_PRIORITIES;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly slaHint = computed(
    () => `Target resolution time: ${formatDuration(SLA_HOURS[this.model().priority])}`,
  );

  protected readonly model = signal<TicketFormModel>({
    title: '',
    description: '',
    category: 'software',
    priority: 'medium',
    customerId: '',
    assigneeId: '',
  });

  protected readonly form = form(
    this.model,
    (p) => {
      required(p.title, { message: 'Title is required' });
      minLength(p.title, 5, { message: 'Title must be at least 5 characters' });
      maxLength(p.title, 120, { message: 'Title must be at most 120 characters' });
      required(p.description, { message: 'Please describe the problem' });
      minLength(p.description, 10, { message: 'Description must be at least 10 characters' });
      maxLength(p.description, 4000, { message: 'Description must be at most 4000 characters' });
      required(p.customerId, { message: 'Select a customer', when: () => this.isStaff() && !this.isEdit() });
    },
    { submission: { action: async () => (await this.save(), undefined) } },
  );

  async ngOnInit(): Promise<void> {
    await this.users.load();
    const id = this.id();
    if (!id) {
      const preselected = this.customer();
      if (preselected && this.isStaff() && this.users.customers().some((c) => c.id === preselected && c.active)) {
        this.model.update((m) => ({ ...m, customerId: preselected }));
      }
      this.state.set('ready');
      return;
    }
    const ticket = await this.tickets.getById(id);
    const user = this.auth.user();
    if (!ticket) {
      this.state.set('not-found');
    } else if (!user || !canEditTicket(user, ticket)) {
      this.state.set('forbidden');
    } else {
      this.ticket.set(ticket);
      this.model.set({
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        customerId: ticket.customerId,
        assigneeId: ticket.assigneeId ?? '',
      });
      this.state.set('ready');
    }
  }

  /** Для canDeactivate: предупреждаем о несохранённых изменениях */
  async canLeave(): Promise<boolean> {
    if (this.saved || this.state() !== 'ready' || !this.form().dirty()) return true;
    return this.confirm.ask({
      title: 'Discard changes?',
      message: 'You have unsaved changes. If you leave this page, they will be lost.',
      confirmText: 'Discard',
      cancelText: 'Keep editing',
      tone: 'danger',
    });
  }

  protected cancel(): void {
    const id = this.id();
    void this.router.navigate(id ? ['/tickets', id] : ['/tickets']);
  }

  private async save(): Promise<void> {
    this.serverError.set(null);
    const m = this.model();
    const draft: TicketDraft = {
      title: m.title,
      description: m.description,
      category: m.category,
      priority: m.priority,
      customerId: m.customerId || undefined,
      assigneeId: this.canAssign() ? m.assigneeId || null : undefined,
    };
    try {
      const existing = this.ticket();
      const result = existing ? await this.tickets.update(existing, draft) : await this.tickets.create(draft);
      this.saved = true;
      this.toast.success(existing ? `Ticket ${result.id} was updated.` : `Ticket ${result.id} was created.`);
      await this.router.navigate(['/tickets', result.id]);
    } catch (error) {
      this.serverError.set(errorMessage(error));
    }
  }
}
