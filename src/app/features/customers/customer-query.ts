import { CustomerSummary } from '@shared/models';

export type AccountFilter = 'all' | 'active' | 'inactive';
export type CustomerSort = 'name' | 'tickets' | 'open' | 'registered' | 'lastTicket';

export interface CustomerQuery {
  search: string;
  status: AccountFilter;
  withOpenTickets: boolean;
  sort: CustomerSort;
}

export const DEFAULT_CUSTOMER_QUERY: CustomerQuery = {
  search: '',
  status: 'all',
  withOpenTickets: false,
  sort: 'name',
};

/** Поиск, фильтрация и сортировка клиентов */
export function queryCustomers(items: readonly CustomerSummary[], q: CustomerQuery): CustomerSummary[] {
  const term = q.search.trim().toLowerCase();
  const filtered = items.filter(({ customer, openTicketCount }) => {
    if (q.status === 'active' && !customer.active) return false;
    if (q.status === 'inactive' && customer.active) return false;
    if (q.withOpenTickets && openTicketCount === 0) return false;
    if (!term) return true;
    return `${customer.name} ${customer.email} ${customer.company ?? ''}`.toLowerCase().includes(term);
  });
  const byName = (a: CustomerSummary, b: CustomerSummary) => a.customer.name.localeCompare(b.customer.name);
  const comparators: Record<CustomerSort, (a: CustomerSummary, b: CustomerSummary) => number> = {
    name: byName,
    tickets: (a, b) => b.ticketCount - a.ticketCount || byName(a, b),
    open: (a, b) => b.openTicketCount - a.openTicketCount || byName(a, b),
    registered: (a, b) => b.customer.createdAt.localeCompare(a.customer.createdAt),
    lastTicket: (a, b) => (b.lastTicketAt ?? '').localeCompare(a.lastTicketAt ?? '') || byName(a, b),
  };
  return [...filtered].sort(comparators[q.sort]);
}
