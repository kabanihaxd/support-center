import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { periodRange } from '@core/domain/report-stats';
import { agentWorkloads, computeStats } from '@core/domain/user-stats';
import { AuthService } from '@core/services/auth.service';
import { Clock } from '@core/services/clock';
import { TicketService } from '@core/services/ticket.service';
import { UserDirectory } from '@core/services/user-directory.service';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { Icon } from '@shared/components/icon/icon';
import { PageHeader } from '@shared/components/page-header/page-header';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { PRIORITY_LABELS, SLA_HOURS, TICKET_PRIORITIES } from '@shared/models';
import { formatDuration } from '@shared/utils/dates';
import { MyQueue } from './my-queue';
import { RecentTickets } from './recent-tickets';
import { StatusBreakdown } from './status-breakdown';
import { TeamStats } from './team-stats';
import { VolumeTrend } from './volume-trend';

/** Dashboard: сводка для сотрудников и «My Dashboard» для клиента */
@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    EmptyState,
    Icon,
    PageHeader,
    StatCard,
    MyQueue,
    RecentTickets,
    StatusBreakdown,
    TeamStats,
    VolumeTrend,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  protected readonly auth = inject(AuthService);
  protected readonly service = inject(TicketService);
  protected readonly users = inject(UserDirectory);
  private readonly clock = inject(Clock);

  protected readonly loading = computed(() => !this.service.loaded() && !this.service.error());
  protected readonly isCustomer = computed(() => this.auth.role() === 'customer');
  protected readonly userId = computed(() => this.auth.user()?.id ?? '');

  protected readonly greeting = computed(() => {
    const hour = this.clock.now().getHours();
    const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = this.auth.user()?.name.split(' ')[0] ?? '';
    return `${part}, ${firstName}`;
  });

  protected readonly stats = computed(() => computeStats(this.service.tickets(), this.clock.now()));
  protected readonly avgResolution = computed(() => formatDuration(this.stats().avgResolutionHours));
  protected readonly range = computed(() => periodRange('30d', this.clock.now()));
  protected readonly recent = computed(() =>
    [...this.service.tickets()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
  );
  protected readonly workloads = computed(() =>
    agentWorkloads(this.users.agents(), this.service.tickets(), this.clock.now()),
  );

  /** Целевое время решения по приоритетам — подсказка клиенту */
  protected readonly targets = [...TICKET_PRIORITIES]
    .reverse()
    .map((p) => ({ priority: p, label: PRIORITY_LABELS[p], time: formatDuration(SLA_HOURS[p]) }));

  constructor() {
    void this.reload();
  }

  protected async reload(): Promise<void> {
    await Promise.all([this.service.load(true), this.users.load()]);
  }
}
