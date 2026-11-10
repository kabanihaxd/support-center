import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { canEditTicket } from '@core/auth/permissions';
import { ticketsToCsv } from '@core/domain/csv-exports';
import { errorMessage } from '@core/errors/app-error';
import { AuthService } from '@core/services/auth.service';
import { Clock } from '@core/services/clock';
import { ConfirmService } from '@core/services/confirm.service';
import { FileDownloadService } from '@core/services/file-download.service';
import { TicketService } from '@core/services/ticket.service';
import { ToastService } from '@core/services/toast.service';
import { UserDirectory } from '@core/services/user-directory.service';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { Icon } from '@shared/components/icon/icon';
import { PageHeader } from '@shared/components/page-header/page-header';
import { Pagination } from '@shared/components/pagination/pagination';
import { Ticket } from '@shared/models';
import { csvFileName } from '@shared/utils/csv';
import { TicketFilters } from './ticket-filters';
import {
  filterTickets,
  PAGE_SIZES,
  parseTicketQuery,
  QueryContext,
  queryTickets,
  SortField,
  sortTickets,
  TicketQuery,
  toQueryParams,
} from './ticket-query';
import { TicketsTable } from './tickets-table';

/** Список тикетов. Состояние фильтров/сортировки/страницы хранится в URL */
@Component({
  selector: 'app-tickets-list-page',
  imports: [RouterLink, PageHeader, EmptyState, Icon, Pagination, TicketFilters, TicketsTable],
  templateUrl: './tickets-list.page.html',
})
export class TicketsListPage {
  protected readonly service = inject(TicketService);
  protected readonly users = inject(UserDirectory);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly clock = inject(Clock);
  private readonly downloads = inject(FileDownloadService);

  // Query-параметры URL (withComponentInputBinding)
  readonly q = input<string>();
  readonly status = input<string>();
  readonly priority = input<string>();
  readonly category = input<string>();
  readonly assignee = input<string>();
  readonly overdue = input<string>();
  readonly sort = input<string>();
  readonly dir = input<string>();
  readonly page = input<string>();
  readonly pageSize = input<string>();

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly query = computed(() =>
    parseTicketQuery({
      q: this.q(),
      status: this.status(),
      priority: this.priority(),
      category: this.category(),
      assignee: this.assignee(),
      overdue: this.overdue(),
      sort: this.sort(),
      dir: this.dir(),
      page: this.page(),
      pageSize: this.pageSize(),
    }),
  );

  private context(): QueryContext {
    return { usersById: this.users.byId(), currentUserId: this.auth.user()?.id ?? null, now: this.clock.now() };
  }

  protected readonly result = computed(() => queryTickets(this.service.tickets(), this.query(), this.context()));

  protected readonly isCustomer = computed(() => this.auth.role() === 'customer');
  protected readonly loading = computed(() => !this.service.loaded() && !this.service.error());
  protected readonly canEdit = computed(() => {
    const user = this.auth.user();
    return (ticket: Ticket) => !!user && canEditTicket(user, ticket);
  });

  constructor() {
    void this.reload();
  }

  protected async reload(): Promise<void> {
    await Promise.all([this.service.load(true), this.users.load()]);
  }

  protected update(patch: Partial<TicketQuery>): void {
    // Любое изменение фильтров возвращает на первую страницу
    const next = { ...this.query(), page: 1, ...patch };
    void this.router.navigate([], { queryParams: toQueryParams(next), replaceUrl: true });
  }

  protected onSort(field: SortField): void {
    const q = this.query();
    const dir = q.sort === field && q.dir === 'desc' ? 'asc' : q.sort === field ? 'desc' : field === 'createdAt' || field === 'priority' ? 'desc' : 'asc';
    this.update({ sort: field, dir, page: q.page });
  }

  /** Выгружает все тикеты текущей выборки (с фильтрами и сортировкой, без пагинации) */
  protected exportCsv(): void {
    const ctx = this.context();
    const q = this.query();
    const tickets = sortTickets(filterTickets(this.service.tickets(), q, ctx), q.sort, q.dir, ctx);
    this.downloads.download(csvFileName('tickets', ctx.now), ticketsToCsv(tickets, ctx.usersById, ctx.now));
    this.toast.success(`Exported ${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}.`);
  }

  protected async onDelete(ticket: Ticket): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: `Delete ${ticket.id}?`,
      message: `“${ticket.title}” and all its comments and history will be permanently deleted. This can't be undone.`,
      confirmText: 'Delete ticket',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await this.service.delete(ticket);
      this.toast.success(`Ticket ${ticket.id} was deleted.`);
    } catch (error) {
      this.toast.error(errorMessage(error));
    }
  }
}
