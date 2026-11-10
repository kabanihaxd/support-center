import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { PriorityBadge } from '@shared/components/badges/priority-badge';
import { StatusBadge } from '@shared/components/badges/status-badge';
import { Ticket, User } from '@shared/models';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';

/** Последние тикеты: компактный список со статусом и приоритетом */
@Component({
  selector: 'app-recent-tickets',
  imports: [RouterLink, EmptyState, PriorityBadge, StatusBadge, RelativeTimePipe],
  template: `
    <section class="card" aria-labelledby="recent-title">
      <div class="card-header">
        <h2 id="recent-title">{{ heading() }}</h2>
        <a routerLink="/tickets" class="view-all">View all</a>
      </div>
      @if (loading()) {
        <div class="rows" aria-busy="true">
          <span class="sr-only">Loading tickets…</span>
          @for (row of [1, 2, 3, 4, 5]; track row) {
            <span class="skeleton" style="height: 52px"></span>
          }
        </div>
      } @else if (!tickets().length) {
        <app-empty-state icon="ticket" title="No tickets yet" [message]="emptyMessage()" />
      } @else {
        <ul class="rows" role="list">
          @for (t of tickets(); track t.id) {
            <li>
              <a class="row" [routerLink]="['/tickets', t.id]">
                <span class="main">
                  <span class="title">{{ t.title }}</span>
                  <span class="meta">
                    <span class="id">{{ t.id }}</span>
                    @if (showCustomer()) {
                      · {{ usersById().get(t.customerId)?.name ?? 'Unknown customer' }}
                    }
                    · {{ t.createdAt | relativeTime }}
                  </span>
                </span>
                <span class="badges">
                  <app-priority-badge [priority]="t.priority" />
                  <app-status-badge [status]="t.status" />
                </span>
              </a>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .card { height: 100%; }
    h2 { font-size: var(--fs-md); }
    .view-all { font-size: var(--fs-sm); font-weight: 500; }
    .rows { display: grid; gap: var(--space-1); margin: 0; padding: var(--space-2); list-style: none; }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      color: inherit;
    }
    .row:hover { background: var(--surface-hover); }
    .row:hover .title { text-decoration: underline; }
    .main { display: grid; gap: 2px; min-width: 0; }
    .title { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .meta { font-size: var(--fs-xs); color: var(--text-muted); }
    .id { font-family: var(--font-mono, monospace); }
    .badges { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--space-2); flex-shrink: 0; }
    @media (max-width: 520px) {
      .row { flex-direction: column; align-items: flex-start; }
      .badges { justify-content: flex-start; }
    }
  `,
})
export class RecentTickets {
  readonly tickets = input.required<readonly Ticket[]>();
  readonly usersById = input.required<ReadonlyMap<string, User>>();
  readonly showCustomer = input(true);
  readonly loading = input(false);
  readonly heading = input('Recent tickets');
  readonly emptyMessage = input('New support requests will appear here.');
}
