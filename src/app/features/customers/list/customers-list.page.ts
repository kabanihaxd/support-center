import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { summarizeCustomers } from '@core/domain/user-stats';
import { TicketService } from '@core/services/ticket.service';
import { UserDirectory } from '@core/services/user-directory.service';
import { UserActionsController } from '@features/people/user-actions.controller';
import { Avatar } from '@shared/components/avatar/avatar';
import { AccountStatusBadge } from '@shared/components/badges/user-badges';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { Icon } from '@shared/components/icon/icon';
import { PageHeader } from '@shared/components/page-header/page-header';
import { Pagination } from '@shared/components/pagination/pagination';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { UserFormDialog } from '@shared/components/user-form-dialog/user-form-dialog';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { AccountFilter, CustomerQuery, CustomerSort, DEFAULT_CUSTOMER_QUERY, queryCustomers } from '../customer-query';

@Component({
  selector: 'app-customers-list-page',
  imports: [
    DatePipe,
    RouterLink,
    Avatar,
    AccountStatusBadge,
    EmptyState,
    Icon,
    PageHeader,
    Pagination,
    StatCard,
    UserFormDialog,
    RelativeTimePipe,
  ],
  providers: [UserActionsController],
  templateUrl: './customers-list.page.html',
  styleUrl: '../../people/people-list.css',
})
export class CustomersListPage {
  private readonly tickets = inject(TicketService);
  private readonly users = inject(UserDirectory);
  protected readonly actions = inject(UserActionsController);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly query = signal<CustomerQuery>({ ...DEFAULT_CUSTOMER_QUERY });
  protected readonly pageSize = signal(10);
  /** Любое изменение фильтров возвращает на первую страницу */
  protected readonly page = linkedSignal({ source: () => [this.query(), this.pageSize()], computation: () => 1 });

  protected readonly summaries = computed(() => summarizeCustomers(this.users.customers(), this.tickets.tickets()));
  protected readonly filtered = computed(() => queryCustomers(this.summaries(), this.query()));
  protected readonly visible = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });
  protected readonly stats = computed(() => {
    const all = this.summaries();
    return {
      total: all.length,
      active: all.filter((s) => s.customer.active).length,
      withOpen: all.filter((s) => s.openTicketCount > 0).length,
    };
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await Promise.all([this.users.load(true), this.tickets.load()]);
      if (this.tickets.error()) this.error.set(this.tickets.error());
    } catch {
      this.error.set('Could not load customers.');
    } finally {
      this.loading.set(false);
    }
  }

  protected patch(change: Partial<CustomerQuery>): void {
    this.query.update((q) => ({ ...q, ...change }));
  }

  protected setStatus(event: Event): void {
    this.patch({ status: this.value(event) as AccountFilter });
  }

  protected setSort(event: Event): void {
    this.patch({ sort: this.value(event) as CustomerSort });
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
