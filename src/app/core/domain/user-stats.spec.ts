import { Agent, Customer, Ticket } from '@shared/models';
import { agentWorkloads, computeStats, loadLevel, summarizeCustomers } from './user-stats';

const now = new Date('2026-01-10T00:00:00.000Z');

const t = (id: number, patch: Partial<Ticket>): Ticket => ({
  id: `TCK-${id}`,
  title: 't',
  description: 'd',
  category: 'other',
  priority: 'medium',
  status: 'open',
  customerId: 'c1',
  assigneeId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  resolvedAt: null,
  dueAt: '2026-01-20T00:00:00.000Z',
  ...patch,
});

const tickets: Ticket[] = [
  t(1, { assigneeId: 'a1', priority: 'critical' }),
  t(2, { assigneeId: 'a1', dueAt: '2026-01-05T00:00:00.000Z' }),
  t(3, { assigneeId: 'a1', status: 'resolved', resolvedAt: '2026-01-01T10:00:00.000Z' }),
  t(4, { customerId: 'c2', status: 'closed', createdAt: '2026-01-02T00:00:00.000Z', resolvedAt: '2026-01-02T20:00:00.000Z' }),
];

const person = <T>(id: string, role: string): T =>
  ({ id, name: id, email: `${id}@x.dev`, role, createdAt: '2025-01-01T00:00:00.000Z', active: true }) as T;

describe('user stats', () => {
  it('computes dashboard stats', () => {
    const stats = computeStats(tickets, now);
    expect(stats).toMatchObject({ total: 4, open: 2, resolved: 1, closed: 1, critical: 1, overdue: 1 });
    expect(stats.avgResolutionHours).toBe(15);
  });

  it('summarizes customers with ticket counts', () => {
    const [c1, c2, c3] = summarizeCustomers(
      [person<Customer>('c1', 'customer'), person<Customer>('c2', 'customer'), person<Customer>('c3', 'customer')],
      tickets,
    );
    expect([c1.ticketCount, c1.openTicketCount]).toEqual([3, 2]);
    expect(c2.lastTicketAt).toBe('2026-01-02T00:00:00.000Z');
    expect(c3.ticketCount).toBe(0);
    expect(c3.lastTicketAt).toBeNull();
  });

  it('computes agent workload', () => {
    const [a1, a2] = agentWorkloads([person<Agent>('a1', 'agent'), person<Agent>('a2', 'agent')], tickets, now);
    expect(a1).toMatchObject({ assignedCount: 3, activeCount: 2, resolvedCount: 1, overdueCount: 1, avgResolutionHours: 10 });
    expect(a2).toMatchObject({ assignedCount: 0, activeCount: 0, avgResolutionHours: null });
  });

  it('classifies load levels', () => {
    expect([loadLevel(0), loadLevel(3), loadLevel(6)]).toEqual(['low', 'normal', 'high']);
  });
});
