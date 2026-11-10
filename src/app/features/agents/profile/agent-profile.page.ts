import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { isActive } from '@core/domain/ticket-rules';
import { agentWorkloads, loadLevel } from '@core/domain/user-stats';
import { Clock } from '@core/services/clock';
import { TicketService } from '@core/services/ticket.service';
import { UserDirectory } from '@core/services/user-directory.service';
import { PersonTickets } from '@features/people/person-tickets';
import { ProfileHeader } from '@features/people/profile-header';
import { UserActionsController } from '@features/people/user-actions.controller';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { Icon } from '@shared/components/icon/icon';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { UserFormDialog } from '@shared/components/user-form-dialog/user-form-dialog';
import { Agent } from '@shared/models';
import { formatDuration } from '@shared/utils/dates';

const LOAD_LABELS = { low: 'Light load', normal: 'Balanced load', high: 'Heavy load' } as const;

@Component({
  selector: 'app-agent-profile-page',
  imports: [RouterLink, ProfileHeader, PersonTickets, EmptyState, Icon, StatCard, UserFormDialog],
  providers: [UserActionsController],
  templateUrl: './agent-profile.page.html',
  styleUrl: '../../people/profile-page.css',
})
export class AgentProfilePage {
  private readonly users = inject(UserDirectory);
  private readonly ticketService = inject(TicketService);
  private readonly clock = inject(Clock);
  private readonly title = inject(Title);
  protected readonly actions = inject(UserActionsController);

  readonly id = input.required<string>();

  protected readonly loading = signal(true);
  protected readonly agent = computed(() => {
    const user = this.users.byId().get(this.id());
    return user && user.role !== 'customer' ? (user as Agent) : null;
  });
  protected readonly assigned = computed(() => this.ticketService.tickets().filter((t) => t.assigneeId === this.id()));
  protected readonly active = computed(() => this.assigned().filter(isActive));
  protected readonly workload = computed(() => {
    const agent = this.agent();
    return agent ? agentWorkloads([agent], this.assigned(), this.clock.now())[0] : null;
  });
  protected readonly loadLabel = computed(() => LOAD_LABELS[loadLevel(this.workload()?.activeCount ?? 0)]);
  protected readonly avgResolution = computed(() => formatDuration(this.workload()?.avgResolutionHours ?? null));

  constructor() {
    effect(() => {
      this.id();
      untracked(() => void this.load());
    });
    effect(() => {
      const a = this.agent();
      if (a) this.title.setTitle(`${a.name} · Agents · SupportCenter`);
    });
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      await Promise.all([this.users.load(), this.ticketService.load()]);
    } finally {
      this.loading.set(false);
    }
  }
}
