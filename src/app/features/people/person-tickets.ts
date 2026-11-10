import { Component, computed, inject, input, signal } from '@angular/core';
import { canEditTicket } from '@core/auth/permissions';
import { AuthService } from '@core/services/auth.service';
import { Clock } from '@core/services/clock';
import { UserDirectory } from '@core/services/user-directory.service';
import { SortDir, SortField, sortTickets } from '@features/tickets/list/ticket-query';
import { TicketsTable } from '@features/tickets/list/tickets-table';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { Ticket } from '@shared/models';

let nextId = 0;

/** Тикеты клиента или специалиста в профиле: таблица с сортировкой */
@Component({
  selector: 'app-person-tickets',
  imports: [TicketsTable, EmptyState],
  template: `
    <section class="card" [attr.aria-labelledby]="headingId">
      <div class="card-header">
        <h2 [id]="headingId">{{ heading() }}</h2>
        <span class="muted">{{ tickets().length }} total</span>
      </div>
      @if (!loading() && !tickets().length) {
        <app-empty-state icon="ticket" title="No tickets yet" [message]="emptyMessage()" />
      } @else {
        <app-tickets-table
          [tickets]="sorted()"
          [usersById]="users.byId()"
          [sort]="sort()"
          [dir]="dir()"
          [loading]="loading()"
          [showCustomer]="showCustomer()"
          [canEdit]="canEdit()"
          (sortChange)="onSort($event)"
        />
      }
    </section>
  `,
  styles: `
    h2 { font-size: var(--fs-md); }
  `,
})
export class PersonTickets {
  protected readonly users = inject(UserDirectory);
  private readonly auth = inject(AuthService);
  private readonly clock = inject(Clock);

  readonly tickets = input.required<readonly Ticket[]>();
  readonly heading = input('Tickets');
  readonly emptyMessage = input('');
  readonly showCustomer = input(false);
  readonly loading = input(false);

  protected readonly headingId = `person-tickets-${nextId++}`;
  protected readonly sort = signal<SortField>('createdAt');
  protected readonly dir = signal<SortDir>('desc');
  protected readonly sorted = computed(() =>
    sortTickets(this.tickets(), this.sort(), this.dir(), {
      usersById: this.users.byId(),
      currentUserId: this.auth.user()?.id ?? null,
      now: this.clock.now(),
    }),
  );
  protected readonly canEdit = computed(() => {
    const user = this.auth.user();
    return (t: Ticket) => !!user && canEditTicket(user, t);
  });

  protected onSort(field: SortField): void {
    if (this.sort() === field) {
      this.dir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sort.set(field);
      this.dir.set(field === 'createdAt' || field === 'priority' ? 'desc' : 'asc');
    }
  }
}
