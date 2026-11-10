import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { computeStats } from '@core/domain/user-stats';
import { AuthService } from '@core/services/auth.service';
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
import { formatDuration } from '@shared/utils/dates';

@Component({
  selector: 'app-customer-profile-page',
  imports: [RouterLink, ProfileHeader, PersonTickets, EmptyState, Icon, StatCard, UserFormDialog],
  providers: [UserActionsController],
  templateUrl: './customer-profile.page.html',
  styleUrl: '../../people/profile-page.css',
})
export class CustomerProfilePage {
  private readonly users = inject(UserDirectory);
  private readonly ticketService = inject(TicketService);
  private readonly clock = inject(Clock);
  private readonly title = inject(Title);
  protected readonly auth = inject(AuthService);
  protected readonly actions = inject(UserActionsController);

  readonly id = input.required<string>();

  protected readonly loading = signal(true);
  protected readonly customer = computed(() => {
    const user = this.users.byId().get(this.id());
    return user?.role === 'customer' ? user : null;
  });
  protected readonly tickets = computed(() => this.ticketService.tickets().filter((t) => t.customerId === this.id()));
  protected readonly stats = computed(() => computeStats(this.tickets(), this.clock.now()));
  protected readonly avgResolution = computed(() => formatDuration(this.stats().avgResolutionHours));
  protected readonly activeCount = computed(() => {
    const s = this.stats();
    return s.open + s.inProgress + s.pending;
  });

  constructor() {
    effect(() => {
      this.id();
      untracked(() => void this.load());
    });
    effect(() => {
      const c = this.customer();
      if (c) this.title.setTitle(`${c.name} · Customers · SupportCenter`);
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
