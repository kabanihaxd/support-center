import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isActive, isOverdue } from '@core/domain/ticket-rules';
import { agentWorkloads } from '@core/domain/user-stats';
import { Clock } from '@core/services/clock';
import { TicketService } from '@core/services/ticket.service';
import { UserDirectory } from '@core/services/user-directory.service';
import { UserActionsController } from '@features/people/user-actions.controller';
import { Avatar } from '@shared/components/avatar/avatar';
import { AccountStatusBadge, RoleBadge } from '@shared/components/badges/user-badges';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { Icon } from '@shared/components/icon/icon';
import { PageHeader } from '@shared/components/page-header/page-header';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { UserFormDialog } from '@shared/components/user-form-dialog/user-form-dialog';
import { formatDuration } from '@shared/utils/dates';
import { WorkloadPanel } from '../workload-panel';

type RoleFilter = 'all' | 'agent' | 'admin';
type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-agents-list-page',
  imports: [
    RouterLink,
    Avatar,
    AccountStatusBadge,
    RoleBadge,
    EmptyState,
    Icon,
    PageHeader,
    StatCard,
    UserFormDialog,
    WorkloadPanel,
  ],
  providers: [UserActionsController],
  templateUrl: './agents-list.page.html',
  styleUrl: '../../people/people-list.css',
})
export class AgentsListPage {
  private readonly tickets = inject(TicketService);
  private readonly users = inject(UserDirectory);
  private readonly clock = inject(Clock);
  protected readonly actions = inject(UserActionsController);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly role = signal<RoleFilter>('all');
  protected readonly status = signal<StatusFilter>('all');

  protected readonly workloads = computed(() =>
    agentWorkloads(this.users.agents(), this.tickets.tickets(), this.clock.now()),
  );
  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.workloads().filter(({ agent }) => {
      if (this.role() !== 'all' && agent.role !== this.role()) return false;
      if (this.status() === 'active' && !agent.active) return false;
      if (this.status() === 'inactive' && agent.active) return false;
      return !term || `${agent.name} ${agent.email} ${agent.jobTitle ?? ''}`.toLowerCase().includes(term);
    });
  });
  protected readonly stats = computed(() => {
    const tickets = this.tickets.tickets();
    const now = this.clock.now();
    return {
      team: this.users.activeAgents().length,
      active: tickets.filter(isActive).length,
      unassigned: tickets.filter((t) => isActive(t) && !t.assigneeId).length,
      overdue: tickets.filter((t) => isOverdue(t, now)).length,
    };
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await Promise.all([this.users.load(true), this.tickets.load()]);
      if (this.tickets.error()) this.error.set(this.tickets.error());
    } catch {
      this.error.set('Could not load the team.');
    } finally {
      this.loading.set(false);
    }
  }

  protected duration(hours: number | null): string {
    return formatDuration(hours);
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onRole(event: Event): void {
    this.role.set((event.target as HTMLSelectElement).value as RoleFilter);
  }

  protected onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as StatusFilter);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.role.set('all');
    this.status.set('all');
  }
}
