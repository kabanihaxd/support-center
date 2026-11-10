import { Ticket, User } from '@shared/models';
import { DEFAULT_QUERY, parseTicketQuery, QueryContext, queryTickets, toQueryParams } from './ticket-query';

const user = (id: string, name: string): User => ({
  id,
  name,
  email: `${id}@x.dev`,
  role: 'customer',
  createdAt: '2026-01-01T00:00:00.000Z',
  active: true,
});

const ticket = (n: number, patch: Partial<Ticket> = {}): Ticket => ({
  id: `TCK-${1000 + n}`,
  title: `Problem ${n}`,
  description: '',
  category: 'software',
  priority: 'medium',
  status: 'open',
  customerId: 'c1',
  assigneeId: null,
  createdAt: `2026-01-${String(n).padStart(2, '0')}T00:00:00.000Z`,
  updatedAt: `2026-01-${String(n).padStart(2, '0')}T00:00:00.000Z`,
  resolvedAt: null,
  dueAt: '2026-02-01T00:00:00.000Z',
  ...patch,
});

const ctx: QueryContext = {
  usersById: new Map([
    ['c1', user('c1', 'Alice Brown')],
    ['c2', user('c2', 'Zoe Clark')],
    ['a1', user('a1', 'Mark Agent')],
  ]),
  currentUserId: 'a1',
  now: new Date('2026-01-20T00:00:00.000Z'),
};

const tickets = [
  ticket(1, { title: 'VPN drops', priority: 'critical', assigneeId: 'a1' }),
  ticket(2, { status: 'resolved', resolvedAt: '2026-01-03T00:00:00.000Z', customerId: 'c2' }),
  ticket(3, { category: 'hardware', priority: 'low', dueAt: '2026-01-10T00:00:00.000Z' }),
  ticket(4, { status: 'pending', assigneeId: 'a1', priority: 'high' }),
];

describe('ticket query', () => {
  it('parses url params and falls back to defaults on bad values', () => {
    const q = parseTicketQuery({ status: 'bogus', page: '-3', pageSize: '7', sort: 'priority', dir: 'asc', overdue: '1' });
    expect(q.status).toBe('');
    expect(q.page).toBe(1);
    expect(q.pageSize).toBe(10);
    expect(q.sort).toBe('priority');
    expect(q.dir).toBe('asc');
    expect(q.overdueOnly).toBe(true);
  });

  it('only writes non-default values to the url', () => {
    expect(Object.values(toQueryParams(DEFAULT_QUERY)).every((v) => v === null)).toBe(true);
    expect(toQueryParams({ ...DEFAULT_QUERY, search: 'vpn', page: 2 })).toMatchObject({ q: 'vpn', page: '2' });
  });

  it('searches by id, title and person name', () => {
    expect(queryTickets(tickets, { ...DEFAULT_QUERY, search: 'vpn' }, ctx).items.map((t) => t.id)).toEqual(['TCK-1001']);
    expect(queryTickets(tickets, { ...DEFAULT_QUERY, search: 'tck-1003' }, ctx).total).toBe(1);
    expect(queryTickets(tickets, { ...DEFAULT_QUERY, search: 'zoe' }, ctx).items[0].id).toBe('TCK-1002');
  });

  it('filters by active status, assignee and overdue', () => {
    expect(queryTickets(tickets, { ...DEFAULT_QUERY, status: 'active' }, ctx).total).toBe(3);
    expect(queryTickets(tickets, { ...DEFAULT_QUERY, assignee: 'me' }, ctx).total).toBe(2);
    expect(queryTickets(tickets, { ...DEFAULT_QUERY, assignee: 'unassigned' }, ctx).total).toBe(2);
    expect(queryTickets(tickets, { ...DEFAULT_QUERY, overdueOnly: true }, ctx).items.map((t) => t.id)).toEqual(['TCK-1003']);
  });

  it('sorts by priority rank and by customer name', () => {
    const byPriority = queryTickets(tickets, { ...DEFAULT_QUERY, sort: 'priority', dir: 'desc' }, ctx);
    expect(byPriority.items.map((t) => t.priority)).toEqual(['critical', 'high', 'medium', 'low']);
    const byCustomer = queryTickets(tickets, { ...DEFAULT_QUERY, sort: 'customer', dir: 'desc' }, ctx);
    expect(byCustomer.items[0].customerId).toBe('c2');
  });

  it('paginates and clamps the page number', () => {
    const many = Array.from({ length: 23 }, (_, i) => ticket(i + 1));
    const last = queryTickets(many, { ...DEFAULT_QUERY, page: 99 }, ctx);
    expect(last.page).toBe(3);
    expect(last.pageCount).toBe(3);
    expect(last.items.length).toBe(3);
  });
});
