import {
  ACTIVE_STATUSES,
  AppNotification,
  Comment,
  SLA_HOURS,
  Ticket,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TicketCategory,
  TicketEvent,
  TicketPriority,
  TicketStatus,
  User,
} from '@shared/models';
import { addHours, DAY_MS, HOUR_MS } from '@shared/utils/dates';
import { FIRST_TICKET_NUMBER, TICKET_ID_PREFIX } from '@shared/utils/id';
import { createRandom, Random } from '@shared/utils/random';
import { createCredential, StoredCredential } from './password-hash';
import {
  AGENT_REPLIES,
  CUSTOMER_FOLLOW_UPS,
  DEMO_PASSWORD,
  INTERNAL_NOTES,
  SEED_CUSTOMERS,
  SEED_STAFF,
  TICKET_TEMPLATES,
} from './seed-catalog';

export interface DemoData {
  users: User[];
  credentials: StoredCredential[];
  tickets: Ticket[];
  comments: Comment[];
  events: TicketEvent[];
  notifications: AppNotification[];
}

const TICKET_COUNT = 84;
const HISTORY_DAYS = 90;
const DEMO_AGENT_ID = 'usr_agent_1';
const DEMO_CUSTOMER_ID = 'usr_cust_1';

/** Генерирует согласованный набор демо-данных относительно текущего времени */
export function generateDemoData(now: Date, seed = 20261110): DemoData {
  const rnd = createRandom(seed);
  const nowMs = now.getTime();
  const users = createUsers(rnd, nowMs);
  const customers = users.filter((u) => u.role === 'customer');
  const staff = users.filter((u) => u.role !== 'customer' && u.active);

  const ctx: BuildContext = { rnd, nowMs, events: [], comments: [], notifications: [] };

  const createdTimes = Array.from({ length: TICKET_COUNT }, () => {
    // Больше свежих тикетов, чем старых
    const ageDays = Math.pow(rnd.next(), 1.35) * HISTORY_DAYS;
    return nowMs - ageDays * DAY_MS - rnd.int(0, 60) * 60_000;
  }).sort((a, b) => a - b);

  const tickets = createdTimes.map((createdMs, index) => {
    const customer = index % 11 === 3 ? customers[0] : rnd.pick(customers);
    return buildTicket(ctx, index, createdMs, customer, staff);
  });

  const credentials = users.map((u) => createCredential(u.id, u.email, DEMO_PASSWORD, `seed-${u.id}`));

  return {
    users,
    credentials,
    tickets,
    comments: ctx.comments,
    events: ctx.events,
    notifications: ctx.notifications,
  };
}

interface BuildContext {
  rnd: Random;
  nowMs: number;
  events: TicketEvent[];
  comments: Comment[];
  notifications: AppNotification[];
}

function createUsers(rnd: Random, nowMs: number): User[] {
  const staff: User[] = SEED_STAFF.map((s, i) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    jobTitle: s.jobTitle,
    active: s.active,
    createdAt: new Date(nowMs - (400 - i * 20) * DAY_MS).toISOString(),
  }));
  const customers: User[] = SEED_CUSTOMERS.map((c, i) => ({
    id: `usr_cust_${i + 1}`,
    name: c.name,
    email: i === 0 ? 'customer@supportcenter.dev' : `${c.name.toLowerCase().replace(' ', '.')}@example.com`,
    role: 'customer',
    company: c.company,
    active: i !== 15,
    createdAt: new Date(nowMs - rnd.int(95, 360) * DAY_MS).toISOString(),
  }));
  return [...staff, ...customers];
}

/** Статус зависит от возраста тикета: свежие — в работе, старые — решены */
function pickStatus(rnd: Random, ageHours: number): TicketStatus {
  if (ageHours < 24) return rnd.weighted<TicketStatus>(['open', 'in_progress', 'pending'], [50, 35, 15]);
  if (ageHours < 24 * 7) {
    return rnd.weighted<TicketStatus>(['open', 'in_progress', 'pending', 'resolved', 'closed'], [20, 30, 15, 25, 10]);
  }
  if (ageHours < 24 * 14) {
    return rnd.weighted<TicketStatus>(['in_progress', 'pending', 'resolved', 'closed'], [12, 8, 35, 45]);
  }
  return rnd.weighted<TicketStatus>(['in_progress', 'pending', 'resolved', 'closed'], [3, 2, 25, 70]);
}

/** Демо-агенту чаще достаются активные тикеты — чтобы в его кабинете было с чем работать */
function staffWeight(staff: User, status: TicketStatus): number {
  if (staff.id === DEMO_AGENT_ID) return ACTIVE_STATUSES.includes(status) ? 9 : 4;
  return staff.role === 'admin' ? 1 : 3;
}

function buildTicket(ctx: BuildContext, index: number, createdMs: number, customer: User, staff: User[]): Ticket {
  const { rnd, nowMs } = ctx;
  const id = `${TICKET_ID_PREFIX}${FIRST_TICKET_NUMBER + index}`;
  const category: TicketCategory = rnd.weighted(TICKET_CATEGORIES, [22, 28, 18, 24, 8]);
  const template = rnd.pick(TICKET_TEMPLATES[category]);
  const priority: TicketPriority = rnd.weighted(TICKET_PRIORITIES, [28, 38, 23, 11]);
  const createdAt = new Date(createdMs).toISOString();
  const ageHours = (nowMs - createdMs) / HOUR_MS;

  let status = pickStatus(rnd, ageHours);
  let resolvedAt: string | null = null;
  if (status === 'resolved' || status === 'closed') {
    const hours = SLA_HOURS[priority] * (0.15 + rnd.next() * 1.25);
    if (createdMs + hours * HOUR_MS < nowMs) {
      resolvedAt = new Date(createdMs + hours * HOUR_MS).toISOString();
    } else {
      status = 'in_progress';
    }
  }

  const unassigned = status === 'open' && rnd.chance(0.45);
  const assignee = unassigned
    ? null
    : rnd.weighted(staff, staff.map((s) => staffWeight(s, status)));

  const ticket: Ticket = {
    id,
    title: template.title,
    description: template.description,
    category,
    priority,
    status,
    customerId: customer.id,
    assigneeId: assignee?.id ?? null,
    createdAt,
    updatedAt: resolvedAt ?? createdAt,
    resolvedAt,
    dueAt: addHours(createdAt, SLA_HOURS[priority]),
  };

  addHistory(ctx, ticket, assignee);
  ticket.updatedAt = latestEventTime(ctx, ticket);
  return ticket;
}

function addHistory(ctx: BuildContext, ticket: Ticket, assignee: User | null): void {
  const { rnd, nowMs } = ctx;
  const createdMs = Date.parse(ticket.createdAt);
  const cap = (ms: number) => Math.min(ms, nowMs - 60_000);
  const event = (type: TicketEvent['type'], actorId: string, at: number, from: string | null, to: string | null) => {
    ctx.events.push({
      id: `evt_${ticket.id}_${ctx.events.length}`,
      ticketId: ticket.id,
      actorId,
      type,
      from,
      to,
      createdAt: new Date(cap(at)).toISOString(),
    });
  };

  event('created', ticket.customerId, createdMs, null, null);
  if (!assignee) return;

  const assignedMs = cap(createdMs + rnd.int(10, 90) * 60_000);
  event('assignee', 'usr_admin', assignedMs, null, assignee.id);
  notify(ctx, assignee.id, 'assigned', ticket.id, `${ticket.id} was assigned to you`, assignedMs);

  if (ticket.status === 'open') return;
  const startedMs = cap(assignedMs + rnd.int(5, 120) * 60_000);
  event('status', assignee.id, startedMs, 'open', 'in_progress');
  notify(ctx, ticket.customerId, 'status', ticket.id, `${ticket.id} is now In Progress`, startedMs);

  const replyMs = cap(startedMs + rnd.int(10, 180) * 60_000);
  addComment(ctx, ticket, assignee.id, rnd.pick(AGENT_REPLIES), replyMs, false);
  if (rnd.chance(0.5)) addComment(ctx, ticket, ticket.customerId, rnd.pick(CUSTOMER_FOLLOW_UPS), cap(replyMs + rnd.int(30, 600) * 60_000), false);
  if (rnd.chance(0.2)) addComment(ctx, ticket, assignee.id, rnd.pick(INTERNAL_NOTES), cap(replyMs + 30 * 60_000), true);

  if (ticket.status === 'pending') {
    event('status', assignee.id, cap(replyMs + 60 * 60_000), 'in_progress', 'pending');
    return;
  }
  if (!ticket.resolvedAt) return;
  const resolvedMs = Date.parse(ticket.resolvedAt);
  event('status', assignee.id, resolvedMs, 'in_progress', 'resolved');
  notify(ctx, ticket.customerId, 'status', ticket.id, `${ticket.id} was resolved`, resolvedMs);
  if (ticket.status === 'closed') {
    event('status', ticket.customerId, cap(resolvedMs + rnd.int(2, 48) * HOUR_MS), 'resolved', 'closed');
  }
}

function addComment(ctx: BuildContext, ticket: Ticket, authorId: string, body: string, atMs: number, internal: boolean) {
  const createdAt = new Date(atMs).toISOString();
  ctx.comments.push({ id: `cmt_${ticket.id}_${ctx.comments.length}`, ticketId: ticket.id, authorId, body, createdAt, internal });
  ctx.events.push({
    id: `evt_${ticket.id}_${ctx.events.length}`,
    ticketId: ticket.id,
    actorId: authorId,
    type: 'comment',
    from: null,
    to: internal ? 'internal' : null,
    createdAt,
  });
  if (!internal && authorId !== ticket.customerId) {
    notify(ctx, ticket.customerId, 'comment', ticket.id, `New reply on ${ticket.id}`, atMs);
  }
}

/** Уведомления создаём только для демо-аккаунтов и только за последние 14 дней */
function notify(ctx: BuildContext, userId: string, type: AppNotification['type'], ticketId: string, message: string, atMs: number) {
  if (userId !== DEMO_AGENT_ID && userId !== DEMO_CUSTOMER_ID) return;
  const ageDays = (ctx.nowMs - atMs) / DAY_MS;
  if (ageDays > 14) return;
  ctx.notifications.push({
    id: `ntf_${ctx.notifications.length}`,
    userId,
    type,
    ticketId,
    message,
    createdAt: new Date(atMs).toISOString(),
    read: ageDays > 2,
  });
}

function latestEventTime(ctx: BuildContext, ticket: Ticket): string {
  return ctx.events
    .filter((e) => e.ticketId === ticket.id)
    .reduce((latest, e) => (e.createdAt > latest ? e.createdAt : latest), ticket.createdAt);
}
