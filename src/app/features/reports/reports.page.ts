import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { agentPerformanceToCsv, ticketsToCsv } from '@core/domain/csv-exports';
import {
  agentPerformance,
  countBy,
  formatPercent,
  granularityFor,
  parsePeriod,
  periodRange,
  REPORT_PERIODS,
  ReportPeriod,
  resolutionByPriority,
  splitByPeriod,
  summarizePeriod,
} from '@core/domain/report-stats';
import { Clock } from '@core/services/clock';
import { FileDownloadService } from '@core/services/file-download.service';
import { TicketService } from '@core/services/ticket.service';
import { ToastService } from '@core/services/toast.service';
import { UserDirectory } from '@core/services/user-directory.service';
import { StatusBreakdown } from '@features/dashboard/status-breakdown';
import { VolumeTrend } from '@features/dashboard/volume-trend';
import { Avatar } from '@shared/components/avatar/avatar';
import { ChartSeries, ChartView } from '@shared/components/chart/chart';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { Icon } from '@shared/components/icon/icon';
import { PageHeader } from '@shared/components/page-header/page-header';
import { StatCard } from '@shared/components/stat-card/stat-card';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SLA_HOURS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from '@shared/models';
import { csvFileName } from '@shared/utils/csv';
import { formatDuration } from '@shared/utils/dates';

/** Отчёты за период: объём, распределения, время решения, SLA, производительность команды */
@Component({
  selector: 'app-reports-page',
  imports: [RouterLink, Avatar, ChartView, EmptyState, Icon, PageHeader, StatCard, StatusBreakdown, VolumeTrend],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.css',
})
export class ReportsPage {
  protected readonly service = inject(TicketService);
  private readonly users = inject(UserDirectory);
  private readonly clock = inject(Clock);
  private readonly router = inject(Router);
  private readonly downloads = inject(FileDownloadService);
  private readonly toast = inject(ToastService);

  /** ?period=7d|30d|90d|12m */
  readonly period = input<string>();

  protected readonly periods = REPORT_PERIODS;
  protected readonly current = computed(() => parsePeriod(this.period()));
  protected readonly currentLabel = computed(() => REPORT_PERIODS.find((p) => p.value === this.current())!.label);
  protected readonly loading = computed(() => !this.service.loaded() && !this.service.error());

  private readonly now = computed(() => {
    // Пересчитываем «сейчас» при смене периода или данных
    this.current();
    this.service.tickets();
    return this.clock.now();
  });
  protected readonly range = computed(() => periodRange(this.current(), this.now()));
  protected readonly granularity = computed(() => granularityFor(this.current()));
  protected readonly split = computed(() => splitByPeriod(this.service.tickets(), this.range()));

  protected readonly summary = computed(() => {
    const s = summarizePeriod(this.service.tickets(), this.range(), this.now());
    return { ...s, avg: formatDuration(s.avgResolutionHours), sla: formatPercent(s.slaRate) };
  });

  protected readonly priorityLabels = TICKET_PRIORITIES.map((p) => PRIORITY_LABELS[p]);
  protected readonly categoryLabels = TICKET_CATEGORIES.map((c) => CATEGORY_LABELS[c]);

  protected readonly prioritySeries = computed<ChartSeries[]>(() => {
    const counts = countBy(this.split().created, TICKET_PRIORITIES, (t) => t.priority);
    return [{ label: 'Tickets', color: 'chart-1', data: TICKET_PRIORITIES.map((p) => counts[p]) }];
  });
  protected readonly categorySeries = computed<ChartSeries[]>(() => {
    const counts = countBy(this.split().created, TICKET_CATEGORIES, (t) => t.category);
    return [{ label: 'Tickets', color: 'chart-5', data: TICKET_CATEGORIES.map((c) => counts[c]) }];
  });
  protected readonly resolutionSeries = computed<ChartSeries[]>(() => {
    const hours = resolutionByPriority(this.split().resolved);
    return [{ label: 'Avg. resolution', color: 'chart-4', data: TICKET_PRIORITIES.map((p) => hours[p]) }];
  });
  protected readonly slaTargets = [...TICKET_PRIORITIES]
    .reverse()
    .map((p) => `${PRIORITY_LABELS[p]} ${formatDuration(SLA_HOURS[p])}`)
    .join(' · ');

  protected readonly performance = computed(() =>
    agentPerformance(
      this.users.agents().filter((a) => a.active),
      this.service.tickets(),
      this.range(),
      this.now(),
    ),
  );

  constructor() {
    void this.reload();
  }

  protected async reload(): Promise<void> {
    await Promise.all([this.service.load(true), this.users.load()]);
  }

  protected setPeriod(period: ReportPeriod): void {
    void this.router.navigate([], { queryParams: { period: period === '30d' ? null : period }, replaceUrl: true });
  }

  protected duration(hours: number | null): string {
    return formatDuration(hours);
  }

  protected percent(rate: number | null): string {
    return formatPercent(rate);
  }

  protected exportTickets(): void {
    const tickets = [...this.split().created].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!tickets.length) {
      this.toast.info('There are no tickets in this period to export.');
      return;
    }
    const csv = ticketsToCsv(tickets, this.users.byId(), this.now());
    this.downloads.download(csvFileName(`tickets-${this.current()}`, this.now()), csv);
    this.toast.success(`Exported ${tickets.length} tickets.`);
  }

  protected exportPerformance(): void {
    const csv = agentPerformanceToCsv(this.performance());
    this.downloads.download(csvFileName(`agent-performance-${this.current()}`, this.now()), csv);
    this.toast.success('Agent performance report exported.');
  }
}
