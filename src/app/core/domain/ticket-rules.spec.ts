import { Ticket } from '@shared/models';
import {
  averageResolutionHours,
  breachedSla,
  isOverdue,
  priorityPatch,
  resolutionHours,
  statusPatch,
} from './ticket-rules';

const base: Ticket = {
  id: 'TCK-1001',
  title: 'VPN',
  description: 'Drops',
  category: 'network',
  priority: 'high',
  status: 'open',
  customerId: 'c',
  assigneeId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  resolvedAt: null,
  dueAt: '2026-01-02T00:00:00.000Z',
};

describe('ticket rules', () => {
  const now = new Date('2026-01-03T00:00:00.000Z');

  it('detects overdue only for active tickets', () => {
    expect(isOverdue(base, now)).toBe(true);
    expect(isOverdue({ ...base, status: 'resolved' }, now)).toBe(false);
    expect(isOverdue(base, new Date('2026-01-01T12:00:00.000Z'))).toBe(false);
  });

  it('detects breached SLA for resolved tickets', () => {
    expect(breachedSla({ ...base, resolvedAt: '2026-01-02T05:00:00.000Z' })).toBe(true);
    expect(breachedSla({ ...base, resolvedAt: '2026-01-01T05:00:00.000Z' })).toBe(false);
    expect(breachedSla(base)).toBe(false);
  });

  it('sets resolvedAt when resolving and keeps it when closing', () => {
    const resolved = statusPatch(base, 'resolved', '2026-01-01T10:00:00.000Z');
    expect(resolved.resolvedAt).toBe('2026-01-01T10:00:00.000Z');
    const closed = statusPatch({ ...base, ...resolved }, 'closed', '2026-01-02T10:00:00.000Z');
    expect(closed.resolvedAt).toBe('2026-01-01T10:00:00.000Z');
  });

  it('clears resolvedAt when reopening', () => {
    const reopened = statusPatch({ ...base, status: 'closed', resolvedAt: '2026-01-01T10:00:00.000Z' }, 'open', '2026-01-05T00:00:00.000Z');
    expect(reopened.resolvedAt).toBeNull();
    expect(reopened.status).toBe('open');
  });

  it('recalculates the SLA due date from creation time when priority changes', () => {
    expect(priorityPatch(base, 'critical', '2026-01-01T01:00:00.000Z').dueAt).toBe('2026-01-01T08:00:00.000Z');
    expect(priorityPatch(base, 'low', '2026-01-01T01:00:00.000Z').dueAt).toBe('2026-01-06T00:00:00.000Z');
  });

  it('computes resolution time and its average', () => {
    const a = { createdAt: '2026-01-01T00:00:00.000Z', resolvedAt: '2026-01-01T04:00:00.000Z' };
    const b = { createdAt: '2026-01-01T00:00:00.000Z', resolvedAt: '2026-01-01T08:00:00.000Z' };
    expect(resolutionHours(a)).toBe(4);
    expect(averageResolutionHours([a, b, { createdAt: a.createdAt, resolvedAt: null }])).toBe(6);
    expect(averageResolutionHours([])).toBeNull();
  });
});
