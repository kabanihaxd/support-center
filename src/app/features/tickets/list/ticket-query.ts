import { isOverdue, PRIORITY_RANK, STATUS_ORDER } from '@core/domain/ticket-rules';
import {
  ACTIVE_STATUSES,
  Ticket,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  User,
} from '@shared/models';

export const SORT_FIELDS = ['id', 'title', 'customer', 'assignee', 'createdAt', 'priority', 'status', 'dueAt'] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortDir = 'asc' | 'desc';

/** «active» — все незакрытые статусы */
export type StatusFilter = TicketStatus | 'active' | '';
/** «me», «unassigned» или id специалиста */
export type AssigneeFilter = string;

export const PAGE_SIZES = [10, 25, 50] as const;

export interface TicketQuery {
  search: string;
  status: StatusFilter;
  priority: TicketPriority | '';
  category: TicketCategory | '';
  assignee: AssigneeFilter;
  overdueOnly: boolean;
  sort: SortField;
  dir: SortDir;
  page: number;
  pageSize: number;
}

export const DEFAULT_QUERY: TicketQuery = {
  search: '',
  status: '',
  priority: '',
  category: '',
  assignee: '',
  overdueOnly: false,
  sort: 'createdAt',
  dir: 'desc',
  page: 1,
  pageSize: 10,
};

export interface QueryContext {
  usersById: ReadonlyMap<string, User>;
  currentUserId: string | null;
  now: Date;
}

export interface QueryResult {
  items: Ticket[];
  total: number;
  page: number;
  pageCount: number;
}

/** Разбор query-параметров URL в типизированный запрос (некорректные значения → по умолчанию) */
export function parseTicketQuery(params: Record<string, string | undefined>): TicketQuery {
  const oneOf = <T extends string>(value: string | undefined, allowed: readonly T[], fallback: T | ''): T | '' =>
    value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  const positive = (value: string | undefined, fallback: number) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : fallback;
  };
  const pageSize = positive(params['pageSize'], DEFAULT_QUERY.pageSize);
  return {
    search: (params['q'] ?? '').trim(),
    status: oneOf<TicketStatus | 'active'>(params['status'], [...TICKET_STATUSES, 'active'], ''),
    priority: oneOf(params['priority'], TICKET_PRIORITIES, ''),
    category: oneOf(params['category'], TICKET_CATEGORIES, ''),
    assignee: params['assignee'] ?? '',
    overdueOnly: params['overdue'] === '1',
    sort: (oneOf(params['sort'], SORT_FIELDS, DEFAULT_QUERY.sort) || DEFAULT_QUERY.sort) as SortField,
    dir: params['dir'] === 'asc' ? 'asc' : params['dir'] === 'desc' ? 'desc' : DEFAULT_QUERY.dir,
    page: positive(params['page'], 1),
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : DEFAULT_QUERY.pageSize,
  };
}

/** Обратное преобразование: только отличающиеся от умолчаний параметры попадают в URL */
export function toQueryParams(query: TicketQuery): Record<string, string | null> {
  const d = DEFAULT_QUERY;
  return {
    q: query.search || null,
    status: query.status || null,
    priority: query.priority || null,
    category: query.category || null,
    assignee: query.assignee || null,
    overdue: query.overdueOnly ? '1' : null,
    sort: query.sort !== d.sort ? query.sort : null,
    dir: query.dir !== d.dir ? query.dir : null,
    page: query.page !== 1 ? String(query.page) : null,
    pageSize: query.pageSize !== d.pageSize ? String(query.pageSize) : null,
  };
}

export function filterTickets(tickets: readonly Ticket[], query: TicketQuery, ctx: QueryContext): Ticket[] {
  const term = query.search.toLowerCase();
  return tickets.filter((t) => {
    if (query.status === 'active' && !ACTIVE_STATUSES.includes(t.status)) return false;
    if (query.status && query.status !== 'active' && t.status !== query.status) return false;
    if (query.priority && t.priority !== query.priority) return false;
    if (query.category && t.category !== query.category) return false;
    if (query.assignee === 'unassigned' && t.assigneeId !== null) return false;
    if (query.assignee === 'me' && t.assigneeId !== ctx.currentUserId) return false;
    if (query.assignee && query.assignee !== 'me' && query.assignee !== 'unassigned' && t.assigneeId !== query.assignee) {
      return false;
    }
    if (query.overdueOnly && !isOverdue(t, ctx.now)) return false;
    if (term) {
      const customer = ctx.usersById.get(t.customerId)?.name ?? '';
      const assignee = t.assigneeId ? (ctx.usersById.get(t.assigneeId)?.name ?? '') : '';
      const haystack = `${t.id} ${t.title} ${customer} ${assignee}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

export function sortTickets(tickets: readonly Ticket[], sort: SortField, dir: SortDir, ctx: QueryContext): Ticket[] {
  const name = (id: string | null) => (id ? (ctx.usersById.get(id)?.name ?? '') : '');
  const value = (t: Ticket): string | number => {
    switch (sort) {
      case 'id':
        return Number(t.id.replace(/\D/g, ''));
      case 'title':
        return t.title.toLowerCase();
      case 'customer':
        return name(t.customerId).toLowerCase();
      case 'assignee':
        // Неназначенные — в конце при сортировке по возрастанию
        return t.assigneeId ? name(t.assigneeId).toLowerCase() : '￿';
      case 'priority':
        return PRIORITY_RANK[t.priority];
      case 'status':
        return STATUS_ORDER[t.status];
      case 'dueAt':
        return t.dueAt;
      case 'createdAt':
        return t.createdAt;
    }
  };
  const factor = dir === 'asc' ? 1 : -1;
  return [...tickets].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va < vb) return -factor;
    if (va > vb) return factor;
    // Стабильный вторичный порядок — новые сверху
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function queryTickets(tickets: readonly Ticket[], query: TicketQuery, ctx: QueryContext): QueryResult {
  const filtered = sortTickets(filterTickets(tickets, query, ctx), query.sort, query.dir, ctx);
  const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.pageSize;
  return { items: filtered.slice(start, start + query.pageSize), total: filtered.length, page, pageCount };
}
