import { Component, computed, DestroyRef, inject, input, linkedSignal, output } from '@angular/core';
import { Icon } from '@shared/components/icon/icon';
import {
  Agent,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '@shared/models';
import { DEFAULT_QUERY, SortDir, SortField, TicketQuery } from './ticket-query';

const SEARCH_DEBOUNCE_MS = 300;

/** Панель поиска и фильтров списка тикетов */
@Component({
  selector: 'app-ticket-filters',
  imports: [Icon],
  templateUrl: './ticket-filters.html',
  styleUrl: './ticket-filters.css',
})
export class TicketFilters {
  readonly query = input.required<TicketQuery>();
  readonly agents = input<readonly Agent[]>([]);
  /** Фильтр по исполнителю — только для сотрудников */
  readonly showAssignee = input(false);
  readonly changed = output<Partial<TicketQuery>>();

  protected readonly statuses = TICKET_STATUSES;
  protected readonly priorities = TICKET_PRIORITIES;
  protected readonly categories = TICKET_CATEGORIES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly sortOptions = [
    { value: 'createdAt:desc', label: 'Newest first' },
    { value: 'createdAt:asc', label: 'Oldest first' },
    { value: 'priority:desc', label: 'Highest priority' },
    { value: 'dueAt:asc', label: 'SLA due soonest' },
    { value: 'status:asc', label: 'Status' },
    { value: 'id:desc', label: 'Ticket ID' },
  ];

  /** Локальное значение поиска (синхронизируется с URL, но вводится без задержек) */
  protected readonly search = linkedSignal(() => this.query().search);
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly hasFilters = computed(() => {
    const q = this.query();
    const d = DEFAULT_QUERY;
    return (
      q.search !== d.search ||
      q.status !== d.status ||
      q.priority !== d.priority ||
      q.category !== d.category ||
      q.assignee !== d.assignee ||
      q.overdueOnly
    );
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.changed.emit({ search: value.trim() }), SEARCH_DEBOUNCE_MS);
  }

  protected onSelect(key: 'status' | 'priority' | 'category' | 'assignee', event: Event): void {
    this.changed.emit({ [key]: (event.target as HTMLSelectElement).value } as Partial<TicketQuery>);
  }

  protected onSort(event: Event): void {
    const [sort, dir] = (event.target as HTMLSelectElement).value.split(':') as [SortField, SortDir];
    this.changed.emit({ sort, dir });
  }

  protected onOverdue(event: Event): void {
    this.changed.emit({ overdueOnly: (event.target as HTMLInputElement).checked });
  }

  protected clear(): void {
    clearTimeout(this.timer);
    this.search.set('');
    this.changed.emit({
      search: '',
      status: '',
      priority: '',
      category: '',
      assignee: '',
      overdueOnly: false,
    });
  }
}
