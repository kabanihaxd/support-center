import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, Ticket, User } from '@shared/models';
import { toCsv } from '@shared/utils/csv';
import { AgentPerformance } from './report-stats';
import { breachedSla, isOverdue, resolutionHours } from './ticket-rules';

const round1 = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10);

export function slaState(ticket: Ticket, now: Date): string {
  if (ticket.resolvedAt) return breachedSla(ticket) ? 'Breached' : 'Met';
  return isOverdue(ticket, now) ? 'Overdue' : 'On track';
}

/** Выгрузка тикетов: одна строка на тикет, даты в ISO (их понимают Excel и Google Sheets) */
export function ticketsToCsv(tickets: readonly Ticket[], usersById: ReadonlyMap<string, User>, now: Date): string {
  const name = (id: string | null) => (id ? (usersById.get(id)?.name ?? 'Unknown user') : '');
  return toCsv(
    [
      'ID',
      'Subject',
      'Status',
      'Priority',
      'Category',
      'Customer',
      'Customer email',
      'Assignee',
      'Created',
      'Updated',
      'Due',
      'Resolved',
      'Resolution (hours)',
      'SLA',
    ],
    tickets.map((t) => [
      t.id,
      t.title,
      STATUS_LABELS[t.status],
      PRIORITY_LABELS[t.priority],
      CATEGORY_LABELS[t.category],
      name(t.customerId),
      usersById.get(t.customerId)?.email ?? '',
      name(t.assigneeId),
      t.createdAt,
      t.updatedAt,
      t.dueAt,
      t.resolvedAt,
      round1(resolutionHours(t)),
      slaState(t, now),
    ]),
  );
}

export function agentPerformanceToCsv(rows: readonly AgentPerformance[]): string {
  return toCsv(
    ['Agent', 'Email', 'Role', 'Assigned', 'Resolved', 'Avg. resolution (hours)', 'SLA met (%)', 'Active now', 'Overdue now'],
    rows.map((r) => [
      r.agent.name,
      r.agent.email,
      r.agent.role,
      r.assigned,
      r.resolved,
      round1(r.avgResolutionHours),
      r.slaRate === null ? null : Math.round(r.slaRate * 100),
      r.active,
      r.overdue,
    ]),
  );
}
