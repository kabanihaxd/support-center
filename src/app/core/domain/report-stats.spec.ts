import { Agent, Ticket, TICKET_STATUSES, User } from '@shared/models';
import { csvFileName, toCsv } from '@shared/utils/csv';
import { agentPerformanceToCsv, slaState, ticketsToCsv } from './csv-exports';
import {
  agentPerformance,
  countBy,
  formatPercent,
  granularityFor,
  parsePeriod,
  periodRange,
  resolutionByPriority,
  slaComplianceRate,
  summarizePeriod,
  volumeSeries,
} from './report-stats';

// Локальное время, чтобы тесты не зависели от часового пояса машины
const now = new Date(2026, 0, 31, 12, 0);
const iso = (day: number, hour = 9) => new Date(2026, 0, day, hour).toISOString();

const t = (id: number, patch: Partial<Ticket>): Ticket => ({
  id: `TCK-${id}`,
  title: 'Printer is down',
  description: 'd',
  category: 'hardware',
  priority: 'medium',
  status: 'open',
  customerId: 'c1',
  assigneeId: null,
  createdAt: iso(20),
  updatedAt: iso(20),
  resolvedAt: null,
  dueAt: iso(30),
  ...patch,
});

const tickets: Ticket[] = [
  // Решён в срок за 10 часов
  t(1, { assigneeId: 'a1', status: 'resolved', createdAt: iso(25, 0), resolvedAt: iso(25, 10), dueAt: iso(26) }),
  // Решён с нарушением SLA (30 часов)
  t(2, { assigneeId: 'a1', status: 'closed', priority: 'high', createdAt: iso(26, 0), resolvedAt: iso(27, 6), dueAt: iso(27, 0) }),
  // Просрочен и в работе
  t(3, { assigneeId: 'a2', status: 'in_progress', priority: 'critical', createdAt: iso(29), dueAt: iso(29, 17) }),
  // Открыт, вне 7-дневного периода
  t(4, { createdAt: iso(5), dueAt: iso(31, 23) }),
];

const agent = (id: string): Agent =>
  ({ id, name: id.toUpperCase(), email: `${id}@x.dev`, role: 'agent', createdAt: iso(1), active: true }) as Agent;

describe('report stats', () => {
  it('parses periods with a safe default', () => {
    expect(parsePeriod('7d')).toBe('7d');
    expect(parsePeriod('nope')).toBe('30d');
    expect(parsePeriod(undefined)).toBe('30d');
    expect([granularityFor('7d'), granularityFor('90d'), granularityFor('12m')]).toEqual(['day', 'week', 'month']);
  });

  it('builds a range that starts at local midnight', () => {
    const { from, to } = periodRange('7d', now);
    expect(from).toEqual(new Date(2026, 0, 25));
    expect(to).toBe(now);
  });

  it('counts created and resolved tickets per bucket', () => {
    const series = volumeSeries(tickets, periodRange('7d', now), 'day');
    expect(series).toHaveLength(7);
    expect(series.reduce((s, p) => s + p.created, 0)).toBe(3);
    expect(series.reduce((s, p) => s + p.resolved, 0)).toBe(2);
    expect(series[0]).toMatchObject({ created: 1, resolved: 1 }); // 25 января
    expect(series[2]).toMatchObject({ created: 0, resolved: 1 }); // 27 января
  });

  it('groups weeks from Monday and months from the 1st', () => {
    const weeks = volumeSeries(tickets, periodRange('30d', now), 'week');
    expect(weeks.every((p) => p.start.getDay() === 1)).toBe(true);
    expect(weeks.reduce((s, p) => s + p.created, 0)).toBe(4);
    const months = volumeSeries(tickets, periodRange('12m', now), 'month');
    expect(months.at(-1)).toMatchObject({ created: 4, resolved: 2 });
    expect(months.every((p) => p.start.getDate() === 1)).toBe(true);
  });

  it('counts by key keeping every key', () => {
    const counts = countBy(tickets, TICKET_STATUSES, (x) => x.status);
    expect(counts).toEqual({ open: 1, in_progress: 1, pending: 0, resolved: 1, closed: 1 });
  });

  it('computes SLA compliance and resolution by priority', () => {
    expect(slaComplianceRate(tickets)).toBe(0.5);
    expect(slaComplianceRate([tickets[2]])).toBeNull();
    const byPriority = resolutionByPriority(tickets);
    expect(byPriority.medium).toBe(10);
    expect(byPriority.high).toBe(30);
    expect(byPriority.critical).toBeNull();
    expect([formatPercent(0.456), formatPercent(null)]).toEqual(['46%', '—']);
  });

  it('summarizes a period', () => {
    expect(summarizePeriod(tickets, periodRange('7d', now), now)).toEqual({
      created: 3,
      resolved: 2,
      stillOpen: 1,
      avgResolutionHours: 20,
      slaRate: 0.5,
      overdueNow: 1,
    });
  });

  it('ranks agent performance by resolved tickets', () => {
    const [a1, a2] = agentPerformance([agent('a2'), agent('a1')], tickets, periodRange('7d', now), now);
    expect(a1).toMatchObject({ assigned: 2, resolved: 2, avgResolutionHours: 20, slaRate: 0.5, active: 0 });
    expect(a2).toMatchObject({ assigned: 1, resolved: 0, slaRate: null, active: 1, overdue: 1 });
  });
});

describe('csv export', () => {
  it('escapes quotes, commas, new lines and formulas', () => {
    const csv = toCsv(['a', 'b'], [['say "hi", ok', '=SUM(A1)'], [1, null], ['line\nbreak', -5]]);
    expect(csv).toBe('a,b\r\n"say ""hi"", ok",\'=SUM(A1)\r\n1,\r\n"line\nbreak",-5');
  });

  it('names files with a local date', () => {
    expect(csvFileName('tickets', now)).toBe('tickets-2026-01-31.csv');
  });

  it('exports tickets with names and SLA state', () => {
    const users = new Map<string, User>([
      ['c1', { id: 'c1', name: 'Jane Doe', email: 'jane@x.dev', role: 'customer', createdAt: iso(1), active: true }],
      ['a1', agent('a1')],
    ]);
    const lines = ticketsToCsv(tickets.slice(0, 2), users, now).split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0].startsWith('ID,Subject,Status')).toBe(true);
    expect(lines[1]).toContain('TCK-1,Printer is down,Resolved,Medium,Hardware,Jane Doe,jane@x.dev,A1');
    expect(lines[1].endsWith(',10,Met')).toBe(true);
    expect(lines[2].endsWith(',30,Breached')).toBe(true);
    expect([slaState(tickets[2], now), slaState(tickets[3], now)]).toEqual(['Overdue', 'On track']);
  });

  it('exports agent performance', () => {
    const rows = agentPerformance([agent('a1')], tickets, periodRange('7d', now), now);
    expect(agentPerformanceToCsv(rows).split('\r\n')[1]).toBe('A1,a1@x.dev,agent,2,2,20,50,0,0');
  });
});
