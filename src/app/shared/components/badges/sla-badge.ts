import { Component, computed, inject, input } from '@angular/core';
import { breachedSla, isActive, isOverdue } from '@core/domain/ticket-rules';
import { Clock } from '@core/services/clock';
import { Ticket } from '@shared/models';
import { formatDuration, hoursBetween } from '@shared/utils/dates';
import { Icon } from '../icon/icon';

/** Состояние SLA: «Overdue 3h», «Due in 5h», «SLA met / breached» */
@Component({
  selector: 'app-sla-badge',
  imports: [Icon],
  template: `
    <span class="sla" [class]="'sla sla-' + state().tone">
      <app-icon [name]="state().tone === 'danger' ? 'warning' : 'timer'" [size]="13" />
      {{ state().label }}
    </span>
  `,
  styles: `
    .sla {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: var(--fs-xs);
      font-weight: 600;
      white-space: nowrap;
    }
    .sla-danger { color: var(--danger-text); }
    .sla-warning { color: var(--warning-text); }
    .sla-ok { color: var(--success-text); }
    .sla-muted { color: var(--text-muted); font-weight: 500; }
  `,
})
export class SlaBadge {
  private readonly clock = inject(Clock);
  readonly ticket = input.required<Pick<Ticket, 'status' | 'dueAt' | 'resolvedAt'>>();

  protected readonly state = computed(() => {
    const t = this.ticket();
    const now = this.clock.now();
    if (isActive(t)) {
      const left = hoursBetween(now.toISOString(), t.dueAt);
      if (isOverdue(t, now)) return { tone: 'danger', label: `Overdue ${formatDuration(-left)}` };
      return { tone: left < 4 ? 'warning' : 'muted', label: `Due in ${formatDuration(left)}` };
    }
    return breachedSla(t) ? { tone: 'muted', label: 'SLA breached' } : { tone: 'ok', label: 'SLA met' };
  });
}
