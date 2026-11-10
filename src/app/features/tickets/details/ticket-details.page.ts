import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { canCloseOrReopen, canEditTicket } from '@core/auth/permissions';
import { AuthService } from '@core/services/auth.service';
import { ConfirmService } from '@core/services/confirm.service';
import { PriorityBadge } from '@shared/components/badges/priority-badge';
import { SlaBadge } from '@shared/components/badges/sla-badge';
import { StatusBadge } from '@shared/components/badges/status-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { Icon } from '@shared/components/icon/icon';
import { CATEGORY_LABELS } from '@shared/models';
import { TicketComments } from './ticket-comments';
import { TicketDetailsStore } from './ticket-details.store';
import { TicketHistory } from './ticket-history';
import { TicketProperties } from './ticket-properties';

@Component({
  selector: 'app-ticket-details-page',
  imports: [
    RouterLink,
    Icon,
    EmptyState,
    StatusBadge,
    PriorityBadge,
    SlaBadge,
    TicketProperties,
    TicketComments,
    TicketHistory,
  ],
  providers: [TicketDetailsStore],
  templateUrl: './ticket-details.page.html',
  styleUrl: './ticket-details.page.css',
})
export class TicketDetailsPage {
  protected readonly store = inject(TicketDetailsStore);
  protected readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  /** :id из маршрута */
  readonly id = input.required<string>();

  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly canEdit = computed(() => {
    const user = this.auth.user();
    const ticket = this.store.ticket();
    return !!user && !!ticket && canEditTicket(user, ticket);
  });
  protected readonly canCloseOrReopen = computed(() => {
    const user = this.auth.user();
    const ticket = this.store.ticket();
    return !!user && !!ticket && canCloseOrReopen(user, ticket);
  });
  protected readonly isFinished = computed(() => {
    const status = this.store.ticket()?.status;
    return status === 'resolved' || status === 'closed';
  });

  constructor() {
    // Переход между тикетами (например, из уведомлений) — перезагружаем
    effect(() => {
      const id = this.id();
      untracked(() => void this.store.load(id));
    });
    effect(() => {
      const t = this.store.ticket();
      if (t) this.title.setTitle(`${t.id} · ${t.title} · SupportCenter`);
    });
  }

  protected async close(): Promise<void> {
    const ticket = this.store.ticket();
    if (!ticket) return;
    const confirmed = await this.confirm.ask({
      title: `Close ${ticket.id}?`,
      message: 'Close this ticket if the problem is solved. You can reopen it later if needed.',
      confirmText: 'Close ticket',
    });
    if (confirmed) await this.store.changeStatus('closed', 'Ticket closed.');
  }

  protected reopen(): Promise<boolean> {
    return this.store.changeStatus('open', 'Ticket reopened.');
  }

  protected async remove(): Promise<void> {
    const ticket = this.store.ticket();
    if (!ticket) return;
    const confirmed = await this.confirm.ask({
      title: `Delete ${ticket.id}?`,
      message: `“${ticket.title}” and all its comments and history will be permanently deleted. This can't be undone.`,
      confirmText: 'Delete ticket',
      tone: 'danger',
    });
    if (confirmed && (await this.store.delete())) await this.router.navigate(['/tickets']);
  }
}
