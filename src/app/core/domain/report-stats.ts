import { Agent, Ticket, TICKET_PRIORITIES, TicketPriority } from '@shared/models';
import { DAY_MS } from '@shared/utils/dates';
import { averageResolutionHours, breachedSla, isActive, isOverdue } from './ticket-rules';

/** Периоды отчётов */
export const REPORT_PERIODS = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: '90d', label: '90 days', days: 90 },
  { value: '12m', label: '12 months', days: 365 },
] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number]['value'];
export const DEFAULT_PERIOD: ReportPeriod = '30d';

export type Granularity = 'day' | 'week' | 'month';

export interface DateRange {
  from: Date;
  to: Date;
}

export function parsePeriod(value: string | undefined): ReportPeriod {
  return REPORT_PERIODS.find((p) => p.value === value)?.value ?? DEFAULT_PERIOD;
}

/** Диапазон периода: с полуночи (локальной) N-1 дней назад до текущего момента */
export function periodRange(period: ReportPeriod, now: Date): DateRange {
  const days = REPORT_PERIODS.find((p) => p.value === period)!.days;
  const from = startOfDay(new Date(now.getTime() - (days - 1) * DAY_MS));
  return { from, to: now };
}

/** Шаг графика: дни для коротких периодов, недели для квартала, месяцы для года */
export function granularityFor(period: ReportPeriod): Granularity {
  if (period === '90d') return 'week';
  if (period === '12m') return 'month';
  return 'day';
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function bucketStart(date: Date, granularity: Granularity): Date {
  if (granularity === 'month') return new Date(date.getFullYear(), date.getMonth(), 1);
  const day = startOfDay(date);
  if (granularity === 'week') {
    // Неделя начинается с понедельника
    const offset = (day.getDay() + 6) % 7;
    return new Date(day.getFullYear(), day.getMonth(), day.getDate() - offset);
  }
  return day;
}

function nextBucket(date: Date, granularity: Granularity): Date {
  if (granularity === 'month') return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const step = granularity === 'week' ? 7 : 1;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + step);
}

function inRange(iso: string | null, range: DateRange): boolean {
  if (!iso) return false;
  const time = Date.parse(iso);
  return time >= range.from.getTime() && time <= range.to.getTime();
}

export interface VolumePoint {
  /** Начало интервала */
  start: Date;
  created: number;
  resolved: number;
}

/** Создано и решено по интервалам — для графика динамики */
export function volumeSeries(tickets: readonly Ticket[], range: DateRange, granularity: Granularity): VolumePoint[] {
  const points: VolumePoint[] = [];
  for (let start = bucketStart(range.from, granularity); start <= range.to; start = nextBucket(start, granularity)) {
    points.push({ start, created: 0, resolved: 0 });
  }
  const indexOf = (iso: string): number => {
    const time = Date.parse(iso);
    for (let i = points.length - 1; i >= 0; i--) if (time >= points[i].start.getTime()) return i;
    return -1;
  };
  for (const t of tickets) {
    if (inRange(t.createdAt, range)) {
      const i = indexOf(t.createdAt);
      if (i >= 0) points[i].created++;
    }
    if (t.resolvedAt && inRange(t.resolvedAt, range)) {
      const i = indexOf(t.resolvedAt);
      if (i >= 0) points[i].resolved++;
    }
  }
  return points;
}

const LABEL_FORMATS: Record<Granularity, Intl.DateTimeFormatOptions> = {
  day: { month: 'short', day: 'numeric' },
  week: { month: 'short', day: 'numeric' },
  month: { month: 'short', year: '2-digit' },
};

export function bucketLabel(start: Date, granularity: Granularity): string {
  const text = start.toLocaleDateString('en-US', LABEL_FORMATS[granularity]);
  return granularity === 'week' ? `Wk of ${text}` : text;
}

/** Количество по ключу в фиксированном порядке ключей (нули тоже — чтобы цвета не «съезжали») */
export function countBy<K extends string>(
  tickets: readonly Ticket[],
  keys: readonly K[],
  key: (t: Ticket) => K,
): Record<K, number> {
  const result = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  for (const t of tickets) result[key(t)]++;
  return result;
}

/** Доля решённых в срок SLA; null — решённых нет */
export function slaComplianceRate(tickets: readonly Ticket[]): number | null {
  const resolved = tickets.filter((t) => t.resolvedAt !== null);
  if (!resolved.length) return null;
  return resolved.filter((t) => !breachedSla(t)).length / resolved.length;
}

export function resolutionByPriority(tickets: readonly Ticket[]): Record<TicketPriority, number | null> {
  const result = {} as Record<TicketPriority, number | null>;
  for (const p of TICKET_PRIORITIES) result[p] = averageResolutionHours(tickets.filter((t) => t.priority === p));
  return result;
}

export interface ReportSummary {
  /** Создано за период */
  created: number;
  /** Решено за период (по дате решения) */
  resolved: number;
  /** Из созданных за период ещё в работе */
  stillOpen: number;
  avgResolutionHours: number | null;
  slaRate: number | null;
  /** Просрочено сейчас (по всем тикетам) */
  overdueNow: number;
}

export interface PeriodTickets {
  /** Созданные за период — для распределений */
  created: Ticket[];
  /** Решённые за период — для времени решения и SLA */
  resolved: Ticket[];
}

export function splitByPeriod(tickets: readonly Ticket[], range: DateRange): PeriodTickets {
  return {
    created: tickets.filter((t) => inRange(t.createdAt, range)),
    resolved: tickets.filter((t) => inRange(t.resolvedAt, range)),
  };
}

export function summarizePeriod(tickets: readonly Ticket[], range: DateRange, now: Date): ReportSummary {
  const { created, resolved } = splitByPeriod(tickets, range);
  return {
    created: created.length,
    resolved: resolved.length,
    stillOpen: created.filter(isActive).length,
    avgResolutionHours: averageResolutionHours(resolved),
    slaRate: slaComplianceRate(resolved),
    overdueNow: tickets.filter((t) => isOverdue(t, now)).length,
  };
}

export interface AgentPerformance {
  agent: Agent;
  /** Назначено из созданных за период */
  assigned: number;
  /** Решено за период */
  resolved: number;
  avgResolutionHours: number | null;
  slaRate: number | null;
  /** Текущая нагрузка (не зависит от периода) */
  active: number;
  overdue: number;
}

export function agentPerformance(
  agents: readonly Agent[],
  tickets: readonly Ticket[],
  range: DateRange,
  now: Date,
): AgentPerformance[] {
  const { created, resolved } = splitByPeriod(tickets, range);
  return agents
    .map((agent) => {
      const own = (list: readonly Ticket[]) => list.filter((t) => t.assigneeId === agent.id);
      const ownResolved = own(resolved);
      const ownAll = own(tickets);
      return {
        agent,
        assigned: own(created).length,
        resolved: ownResolved.length,
        avgResolutionHours: averageResolutionHours(ownResolved),
        slaRate: slaComplianceRate(ownResolved),
        active: ownAll.filter(isActive).length,
        overdue: ownAll.filter((t) => isOverdue(t, now)).length,
      };
    })
    .sort((a, b) => b.resolved - a.resolved || a.agent.name.localeCompare(b.agent.name));
}

export function formatPercent(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate * 100)}%`;
}
