import { Component, input } from '@angular/core';

/** Заголовок страницы + описание + слот для кнопок действий */
@Component({
  selector: 'app-page-header',
  template: `
    <div class="text">
      <h1>{{ title() }}</h1>
      @if (subtitle()) {
        <p class="muted">{{ subtitle() }}</p>
      }
    </div>
    <div class="actions">
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-4);
    }
    .text {
      display: grid;
      gap: var(--space-1);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
