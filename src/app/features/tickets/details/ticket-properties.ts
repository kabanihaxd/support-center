import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserDirectory } from '@core/services/user-directory.service';
import { Avatar } from '@shared/components/avatar/avatar';
import { PriorityBadge } from '@shared/components/badges/priority-badge';
import { SlaBadge } from '@shared/components/badges/sla-badge';
import { StatusBadge } from '@shared/components/badges/status-badge';
import { Icon } from '@shared/components/icon/icon';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TicketPriority,
  TicketStatus,
} from '@shared/models';
import { TicketDetailsStore } from './ticket-details.store';

/** Боковая панель: статус, приоритет, исполнитель и сведения о тикете */
@Component({
  selector: 'app-ticket-properties',
  imports: [DatePipe, RouterLink, Avatar, Icon, StatusBadge, PriorityBadge, SlaBadge],
  templateUrl: './ticket-properties.html',
  styleUrl: './ticket-properties.css',
})
export class TicketProperties {
  protected readonly store = inject(TicketDetailsStore);
  protected readonly users = inject(UserDirectory);
  protected readonly auth = inject(AuthService);

  protected readonly statuses = TICKET_STATUSES;
  protected readonly priorities = TICKET_PRIORITIES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly categoryLabels = CATEGORY_LABELS;

  protected readonly ticket = computed(() => this.store.ticket()!);
  protected readonly customer = computed(() => this.users.byId().get(this.ticket().customerId) ?? null);
  protected readonly assignee = computed(() => {
    const id = this.ticket().assigneeId;
    return id ? (this.users.byId().get(id) ?? null) : null;
  });
  protected readonly isMine = computed(() => this.ticket().assigneeId === this.auth.user()?.id);

  protected async onStatus(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const ok = await this.store.changeStatus(select.value as TicketStatus);
    if (!ok) select.value = this.ticket().status; // откатываем выбор при ошибке
  }

  protected async onPriority(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const ok = await this.store.changePriority(select.value as TicketPriority);
    if (!ok) select.value = this.ticket().priority;
  }

  protected async onAssignee(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const ok = await this.store.assign(select.value || null);
    if (!ok) select.value = this.ticket().assigneeId ?? '';
  }

  protected assignToMe(): void {
    const id = this.auth.user()?.id;
    if (id) void this.store.assign(id);
  }
}
