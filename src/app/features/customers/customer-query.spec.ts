import { Customer, CustomerSummary } from '@shared/models';
import { DEFAULT_CUSTOMER_QUERY, queryCustomers } from './customer-query';

const summary = (id: string, name: string, patch: Partial<Customer>, tickets: number, open: number): CustomerSummary => ({
  customer: {
    id,
    name,
    email: `${id}@example.com`,
    role: 'customer',
    createdAt: '2026-01-01T00:00:00.000Z',
    active: true,
    ...patch,
  },
  ticketCount: tickets,
  openTicketCount: open,
  lastTicketAt: tickets ? `2026-02-0${tickets}T00:00:00.000Z` : null,
});

const list = [
  summary('c1', 'Zoe Clark', { company: 'Contoso' }, 3, 1),
  summary('c2', 'Adam Smith', { active: false }, 1, 0),
  summary('c3', 'Mia Brown', { company: 'Fabrikam' }, 0, 0),
];

describe('queryCustomers', () => {
  it('sorts by name by default', () => {
    expect(queryCustomers(list, DEFAULT_CUSTOMER_QUERY).map((s) => s.customer.name)).toEqual([
      'Adam Smith',
      'Mia Brown',
      'Zoe Clark',
    ]);
  });

  it('searches by name, email and company', () => {
    expect(queryCustomers(list, { ...DEFAULT_CUSTOMER_QUERY, search: 'fabri' })[0].customer.id).toBe('c3');
    expect(queryCustomers(list, { ...DEFAULT_CUSTOMER_QUERY, search: 'c2@' })[0].customer.id).toBe('c2');
  });

  it('filters by status and open tickets', () => {
    expect(queryCustomers(list, { ...DEFAULT_CUSTOMER_QUERY, status: 'inactive' }).map((s) => s.customer.id)).toEqual(['c2']);
    expect(queryCustomers(list, { ...DEFAULT_CUSTOMER_QUERY, withOpenTickets: true }).map((s) => s.customer.id)).toEqual(['c1']);
  });

  it('sorts by ticket count and last request', () => {
    expect(queryCustomers(list, { ...DEFAULT_CUSTOMER_QUERY, sort: 'tickets' })[0].customer.id).toBe('c1');
    expect(queryCustomers(list, { ...DEFAULT_CUSTOMER_QUERY, sort: 'lastTicket' }).map((s) => s.customer.id)).toEqual(['c1', 'c2', 'c3']);
  });
});
