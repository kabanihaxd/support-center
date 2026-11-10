import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

/** Пустое состояние / ошибка загрузки. Кнопки действий передаются через <ng-content> */
@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  template: `
    <div class="icon" [class.danger]="tone() === 'error'">
      <app-icon [name]="icon()" [size]="24" />
    </div>
    <h2 class="title">{{ title() }}</h2>
    @if (message()) {
      <p class="muted">{{ message() }}</p>
    }
    <div class="actions">
      <ng-content />
    </div>
  `,
  host: { '[attr.role]': "tone() === 'error' ? 'alert' : null" },
  styles: `
    :host {
      display: grid;
      justify-items: center;
      gap: var(--space-2);
      padding: var(--space-8) var(--space-4);
      text-align: center;
    }
    .icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin-bottom: var(--space-2);
      border-radius: 50%;
      background: var(--primary-soft);
      color: var(--primary-text);
    }
    .icon.danger {
      background: var(--danger-soft);
      color: var(--danger-text);
    }
    .title {
      font-size: var(--fs-lg);
    }
    p {
      max-width: 420px;
    }
    .actions:not(:empty) {
      display: flex;
      gap: var(--space-2);
      margin-top: var(--space-3);
    }
  `,
})
export class EmptyState {
  readonly icon = input<IconName>('inbox');
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly tone = input<'neutral' | 'error'>('neutral');
}
