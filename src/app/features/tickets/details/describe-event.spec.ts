import { TicketEvent } from '@shared/models';
import { describeEvent } from './describe-event';

const ev = (patch: Partial<TicketEvent>): TicketEvent => ({
  id: 'e',
  ticketId: 'TCK-1001',
  actorId: 'a',
  type: 'created',
  from: null,
  to: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...patch,
});

const names: Record<string, string> = { a1: 'Ann', a2: 'Bob' };
const nameOf = (id: string | null) => (id ? names[id] : 'Unassigned');

describe('describeEvent', () => {
  it('describes status and priority changes with labels', () => {
    expect(describeEvent(ev({ type: 'status', from: 'open', to: 'in_progress' }), nameOf)).toBe(
      'changed status from Open to In Progress',
    );
    expect(describeEvent(ev({ type: 'priority', from: 'low', to: 'critical' }), nameOf)).toBe(
      'changed priority from Low to Critical',
    );
  });

  it('describes assignment, reassignment and unassignment', () => {
    expect(describeEvent(ev({ type: 'assignee', to: 'a1' }), nameOf)).toBe('assigned the ticket to Ann');
    expect(describeEvent(ev({ type: 'assignee', from: 'a1', to: 'a2' }), nameOf)).toBe('reassigned from Ann to Bob');
    expect(describeEvent(ev({ type: 'assignee', from: 'a2', to: null }), nameOf)).toBe('unassigned Bob');
  });

  it('distinguishes internal notes', () => {
    expect(describeEvent(ev({ type: 'comment', to: 'internal' }), nameOf)).toBe('added an internal note');
    expect(describeEvent(ev({ type: 'comment' }), nameOf)).toBe('added a comment');
  });
});
