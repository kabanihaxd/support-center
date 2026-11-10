export const TICKET_STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_CATEGORIES = ['hardware', 'software', 'network', 'access', 'other'] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  hardware: 'Hardware',
  software: 'Software',
  network: 'Network',
  access: 'Access & Accounts',
  other: 'Other',
};

/** SLA: за сколько часов тикет должен быть решён */
export const SLA_HOURS: Record<TicketPriority, number> = {
  critical: 8,
  high: 24,
  medium: 72,
  low: 120,
};

/** Статусы, в которых тикет ещё в работе */
export const ACTIVE_STATUSES: readonly TicketStatus[] = ['open', 'in_progress', 'pending'];

export interface Ticket {
  /** Человекочитаемый уникальный ID, например TCK-1042 */
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  customerId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Когда тикет перешёл в Resolved/Closed (для среднего времени решения) */
  resolvedAt: string | null;
  /** Дедлайн по SLA */
  dueAt: string;
}

export type TicketEventType = 'created' | 'status' | 'priority' | 'assignee' | 'edited' | 'comment';

/** Запись истории изменений тикета */
export interface TicketEvent {
  id: string;
  ticketId: string;
  actorId: string;
  type: TicketEventType;
  from: string | null;
  to: string | null;
  createdAt: string;
}
