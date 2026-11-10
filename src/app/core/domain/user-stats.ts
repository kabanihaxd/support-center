import {
  Agent,
  AgentWorkload,
  Customer,
  CustomerSummary,
  DashboardStats,
  Ticket,
} from '@shared/models';
import { averageResolutionHours, isActive, isOverdue } from './ticket-rules';

/** Сводка по набору тикетов: используется на Dashboard и в профилях */
export function computeStats(tickets: readonly Ticket[], now: Date): DashboardStats {
  const count = (fn: (t: Ticket) => boolean) => tickets.filter(fn).length;
  return {
    total: tickets.length,
    open: count((t) => t.status === 'open'),
    inProgress: count((t) => t.status === 'in_progress'),
    pending: count((t) => t.status === 'pending'),
    resolved: count((t) => t.status === 'resolved'),
    closed: count((t) => t.status === 'closed'),
    critical: count((t) => t.priority === 'critical' && isActive(t)),
    overdue: count((t) => isOverdue(t, now)),
    avgResolutionHours: averageResolutionHours(tickets),
  };
}

function groupBy(tickets: readonly Ticket[], key: (t: Ticket) => string | null): Map<string, Ticket[]> {
  const map = new Map<string, Ticket[]>();
  for (const t of tickets) {
    const k = key(t);
    if (k === null) continue;
    const list = map.get(k);
    if (list) list.push(t);
    else map.set(k, [t]);
  }
  return map;
}

export function summarizeCustomers(customers: readonly Customer[], tickets: readonly Ticket[]): CustomerSummary[] {
  const byCustomer = groupBy(tickets, (t) => t.customerId);
  return customers.map((customer) => {
    const own = byCustomer.get(customer.id) ?? [];
    return {
      customer,
      ticketCount: own.length,
      openTicketCount: own.filter(isActive).length,
      lastTicketAt: own.reduce<string | null>((latest, t) => (!latest || t.createdAt > latest ? t.createdAt : latest), null),
    };
  });
}

export function agentWorkloads(agents: readonly Agent[], tickets: readonly Ticket[], now: Date): AgentWorkload[] {
  const byAgent = groupBy(tickets, (t) => t.assigneeId);
  return agents.map((agent) => {
    const assigned = byAgent.get(agent.id) ?? [];
    return {
      agent,
      assignedCount: assigned.length,
      activeCount: assigned.filter(isActive).length,
      resolvedCount: assigned.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
      overdueCount: assigned.filter((t) => isOverdue(t, now)).length,
      avgResolutionHours: averageResolutionHours(assigned),
    };
  });
}

/** Уровень загрузки по числу активных тикетов */
export type LoadLevel = 'low' | 'normal' | 'high';

export const WORKLOAD_THRESHOLDS = { normal: 3, high: 6 } as const;

export function loadLevel(activeCount: number): LoadLevel {
  if (activeCount >= WORKLOAD_THRESHOLDS.high) return 'high';
  if (activeCount >= WORKLOAD_THRESHOLDS.normal) return 'normal';
  return 'low';
}
