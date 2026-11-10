import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { UserDirectory } from '@core/services/user-directory.service';
import { Icon } from '@shared/components/icon/icon';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { describeEvent, EVENT_ICONS } from './describe-event';
import { TicketDetailsStore } from './ticket-details.store';

/** Хронология изменений тикета */
@Component({
  selector: 'app-ticket-history',
  imports: [DatePipe, Icon, RelativeTimePipe],
  template: `
    <section class="card" aria-labelledby="history-title">
      <h2 id="history-title" class="card-header">Activity</h2>
      <div class="card-body">
        @if (store.activityLoading() && !items().length) {
          <span class="skeleton" style="height: 120px" aria-hidden="true"></span>
        } @else {
          <ol class="timeline" role="list">
            @for (item of items(); track item.id) {
              <li>
                <span class="dot"><app-icon [name]="item.icon" [size]="13" /></span>
                <p>
                  <strong>{{ item.actor }}</strong> {{ item.text }}
                  <time class="muted" [attr.datetime]="item.createdAt" [title]="item.createdAt | date: 'MMM d, y, HH:mm'">
                    · {{ item.createdAt | relativeTime }}
                  </time>
                </p>
              </li>
            }
          </ol>
        }
      </div>
    </section>
  `,
  styles: `
    .card-header { margin: 0; font-size: var(--fs-md); }
    .timeline { position: relative; display: grid; gap: var(--space-4); margin: 0; padding: 0; list-style: none; }
    .timeline::before {
      content: '';
      position: absolute;
      top: 12px;
      bottom: 12px;
      left: 13px;
      width: 2px;
      background: var(--border);
    }
    li { position: relative; display: flex; align-items: flex-start; gap: var(--space-3); }
    .dot {
      position: relative;
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      border: 2px solid var(--surface);
      border-radius: 50%;
      background: var(--surface-2);
      color: var(--text-muted);
    }
    p { padding-top: 3px; font-size: var(--fs-md); }
    time { font-size: var(--fs-sm); white-space: nowrap; }
  `,
})
export class TicketHistory {
  protected readonly store = inject(TicketDetailsStore);
  private readonly users = inject(UserDirectory);

  protected readonly items = computed(() => {
    const nameOf = (id: string | null) => this.users.name(id);
    return this.store.events().map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      actor: nameOf(e.actorId),
      text: describeEvent(e, nameOf),
      icon: EVENT_ICONS[e.type],
    }));
  });
}
