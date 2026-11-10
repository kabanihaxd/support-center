import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '@shared/components/avatar/avatar';
import { PriorityBadge } from '@shared/components/badges/priority-badge';
import { SlaBadge } from '@shared/components/badges/sla-badge';
import { StatusBadge } from '@shared/components/badges/status-badge';
import { Icon } from '@shared/components/icon/icon';
import { CATEGORY_LABELS, Ticket, User } from '@shared/models';
import { SortDir, SortField } from './ticket-query';

interface Column {
  field: SortField;
  label: string;
  className?: string;
}

/** Таблица тикетов с сортировкой по колонкам и действиями в строке */
@Component({
  selector: 'app-tickets-table',
  imports: [RouterLink, DatePipe, Avatar, PriorityBadge, StatusBadge, SlaBadge, Icon],
  templateUrl: './tickets-table.html',
  styleUrl: './tickets-table.css',
})
export class TicketsTable {
  readonly tickets = input.required<readonly Ticket[]>();
  readonly usersById = input.required<ReadonlyMap<string, User>>();
  readonly sort = input.required<SortField>();
  readonly dir = input.required<SortDir>();
  readonly loading = input(false);
  readonly showCustomer = input(true);
  readonly canEdit = input.required<(ticket: Ticket) => boolean>();
  readonly canDelete = input(false);

  readonly sortChange = output<SortField>();
  readonly deleteTicket = output<Ticket>();

  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  protected readonly columns = computed<Column[]>(() => [
    { field: 'id', label: 'ID', className: 'col-id' },
    { field: 'title', label: 'Subject', className: 'col-title' },
    ...(this.showCustomer() ? [{ field: 'customer' as const, label: 'Customer', className: 'col-customer' }] : []),
    { field: 'assignee', label: 'Assignee', className: 'col-assignee' },
    { field: 'priority', label: 'Priority', className: 'col-priority' },
    { field: 'status', label: 'Status', className: 'col-status' },
    { field: 'createdAt', label: 'Created', className: 'col-created' },
  ]);

  protected ariaSort(field: SortField): 'ascending' | 'descending' | null {
    if (this.sort() !== field) return null;
    return this.dir() === 'asc' ? 'ascending' : 'descending';
  }

  protected name(id: string | null): string {
    if (!id) return 'Unassigned';
    return this.usersById().get(id)?.name ?? 'Unknown user';
  }
}
