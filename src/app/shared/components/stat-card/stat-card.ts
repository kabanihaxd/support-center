import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

export type StatTone = 'primary' | 'violet' | 'amber' | 'green' | 'red' | 'gray';

/** Карточка метрики: подпись, значение, иконка, подсказка */
@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  template: `
    <div class="text">
      <p class="label">{{ label() }}</p>
      <p class="value">
        @if (loading()) {
          <span class="skeleton" style="display: inline-block; height: 28px; width: 56px"></span>
          <span class="sr-only">Loading</span>
        } @else {
          {{ value() }}
        }
      </p>
      @if (hint()) {
        <p class="hint">{{ hint() }}</p>
      }
    </div>
    <span class="icon" [class]="'icon tone-' + tone()" aria-hidden="true">
      <app-icon [name]="icon()" [size]="20" />
    </span>
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-5);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    .text { display: grid; gap: 2px; min-width: 0; }
    .label { font-size: var(--fs-sm); color: var(--text-muted); font-weight: 500; }
    .value { font-size: var(--fs-3xl); font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }
    .hint { font-size: var(--fs-xs); color: var(--text-muted); }
    .icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: var(--radius-md);
    }
    .tone-primary { background: var(--status-open-bg); color: var(--status-open-fg); }
    .tone-violet { background: var(--status-in_progress-bg); color: var(--status-in_progress-fg); }
    .tone-amber { background: var(--status-pending-bg); color: var(--status-pending-fg); }
    .tone-green { background: var(--status-resolved-bg); color: var(--status-resolved-fg); }
    .tone-red { background: var(--priority-critical-bg); color: var(--priority-critical-fg); }
    .tone-gray { background: var(--status-closed-bg); color: var(--status-closed-fg); }
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input<string | number>('—');
  readonly icon = input<IconName>('ticket');
  readonly tone = input<StatTone>('primary');
  readonly hint = input('');
  readonly loading = input(false);
}
