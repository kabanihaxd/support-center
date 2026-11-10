import { ACTIVE_STATUSES, SLA_HOURS, Ticket, TicketPriority, TicketStatus } from '@shared/models';
import { addHours, hoursBetween } from '@shared/utils/dates';

/** Порядок статусов для сортировки */
export const STATUS_ORDER: Record<TicketStatus, number> = {
  open: 0,
  in_progress: 1,
  pending: 2,
  resolved: 3,
  closed: 4,
};

/** Вес приоритета для сортировки (critical — самый высокий) */
export const PRIORITY_RANK: Record<TicketPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function isActive(ticket: Pick<Ticket, 'status'>): boolean {
  return ACTIVE_STATUSES.includes(ticket.status);
}

/** Тикет ещё в работе, а дедлайн SLA уже прошёл */
export function isOverdue(ticket: Pick<Ticket, 'status' | 'dueAt'>, now: Date): boolean {
  return isActive(ticket) && Date.parse(ticket.dueAt) < now.getTime();
}

/** Решён позже дедлайна SLA */
export function breachedSla(ticket: Pick<Ticket, 'resolvedAt' | 'dueAt'>): boolean {
  return ticket.resolvedAt !== null && ticket.resolvedAt > ticket.dueAt;
}

export function dueDateFor(createdAt: string, priority: TicketPriority): string {
  return addHours(createdAt, SLA_HOURS[priority]);
}

/**
 * Изменения при смене статуса: при решении фиксируем resolvedAt
 * (переход Resolved → Closed его сохраняет), при переоткрытии — сбрасываем.
 */
export function statusPatch(ticket: Ticket, next: TicketStatus, nowIso: string): Partial<Ticket> {
  const resolving = next === 'resolved' || next === 'closed';
  return {
    status: next,
    updatedAt: nowIso,
    resolvedAt: resolving ? (ticket.resolvedAt ?? nowIso) : null,
  };
}

/** Смена приоритета пересчитывает дедлайн SLA от даты создания */
export function priorityPatch(ticket: Ticket, next: TicketPriority, nowIso: string): Partial<Ticket> {
  return { priority: next, dueAt: dueDateFor(ticket.createdAt, next), updatedAt: nowIso };
}

export function resolutionHours(ticket: Pick<Ticket, 'createdAt' | 'resolvedAt'>): number | null {
  return ticket.resolvedAt ? hoursBetween(ticket.createdAt, ticket.resolvedAt) : null;
}

export function averageResolutionHours(tickets: readonly Pick<Ticket, 'createdAt' | 'resolvedAt'>[]): number | null {
  const hours = tickets.map(resolutionHours).filter((h): h is number => h !== null);
  if (!hours.length) return null;
  return hours.reduce((sum, h) => sum + h, 0) / hours.length;
}
