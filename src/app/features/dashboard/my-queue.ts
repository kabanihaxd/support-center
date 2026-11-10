import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isActive } from '@core/domain/ticket-rules';
import { PriorityBadge } from '@shared/components/badges/priority-badge';
import { SlaBadge } from '@shared/components/badges/sla-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { Ticket } from '@shared/models';

/** Очередь агента: его активные тикеты, ближайший дедлайн SLA — сверху */
@Component({
  selector: 'app-my-queue',
  imports: [RouterLink, PriorityBadge, SlaBadge, EmptyState],
  template: `
    <section class="card" aria-labelledby="queue-title">
      <div class="card-header">
        <h2 id="queue-title">My queue</h2>
        <a routerLink="/tickets" [queryParams]="{ assignee: 'me', status: 'active' }" class="view-all">
          View all ({{ queue().length }})
        </a>
      </div>
      @if (loading()) {
        <div class="rows" aria-busy="true">
          <span class="sr-only">Loading your queue…</span>
          @for (row of [1, 2, 3]; track row) {
            <span class="skeleton" style="height: 52px"></span>
          }
        </div>
      } @else if (!queue().length) {
        <app-empty-state icon="circle-check" title="All caught up" message="No active tickets are assigned to you." />
      } @else {
        <ul class="rows" role="list">
          @for (t of visible(); track t.id) {
            <li>
              <a class="row" [routerLink]="['/tickets', t.id]">
                <span class="main">
                  <span class="title">{{ t.title }}</span>
                  <span class="meta">{{ t.id }}</span>
                </span>
                <span class="side">
                  <app-priority-badge [priority]="t.priority" />
                  <app-sla-badge [ticket]="t" />
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
    .meta { font-size: var(--fs-xs); color: var(--text-muted); font-family: var(--font-mono, monospace); }
    .side { display: grid; justify-items: end; gap: 4px; flex-shrink: 0; }
  `,
})
export class MyQueue {
  readonly tickets = input.required<readonly Ticket[]>();
  readonly userId = input.required<string>();
  readonly loading = input(false);
  readonly limit = input(6);

  protected readonly queue = computed(() =>
    this.tickets()
      .filter((t) => t.assigneeId === this.userId() && isActive(t))
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
  );
  protected readonly visible = computed(() => this.queue().slice(0, this.limit()));
}
