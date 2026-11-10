import { Component, computed, input } from '@angular/core';
import { PRIORITY_LABELS, TicketPriority } from '@shared/models';

/** Приоритет: цвет + полоски уровня (не полагаемся только на цвет) */
@Component({
  selector: 'app-priority-badge',
  template: `
    <span class="badge" [style.background]="bg()" [style.color]="fg()">
      <span class="bars" aria-hidden="true">
        @for (bar of bars; track bar) {
          <span class="bar" [class.on]="bar <= level()"></span>
        }
      </span>
      {{ label() }}
    </span>
  `,
  styles: `
    .bars {
      display: inline-flex;
      align-items: flex-end;
      gap: 1.5px;
      height: 10px;
    }
    .bar {
      width: 3px;
      border-radius: 1px;
      background: currentColor;
      opacity: 0.25;
    }
    .bar:nth-child(1) { height: 4px; }
    .bar:nth-child(2) { height: 6px; }
    .bar:nth-child(3) { height: 8px; }
    .bar:nth-child(4) { height: 10px; }
    .bar.on { opacity: 1; }
  `,
})
export class PriorityBadge {
  readonly priority = input.required<TicketPriority>();
  protected readonly bars = [1, 2, 3, 4];
  protected readonly label = computed(() => PRIORITY_LABELS[this.priority()]);
  protected readonly level = computed(() => ({ low: 1, medium: 2, high: 3, critical: 4 })[this.priority()]);
  protected readonly bg = computed(() => `var(--priority-${this.priority()}-bg)`);
  protected readonly fg = computed(() => `var(--priority-${this.priority()}-fg)`);
}
