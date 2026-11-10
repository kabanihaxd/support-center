import { Component, computed, input, Signal } from '@angular/core';

/** Минимальный контракт состояния поля Signal Forms, нужный для вывода ошибок */
export interface FieldErrorsState {
  errors: Signal<readonly { message?: string; kind: string }[]>;
  touched: Signal<boolean>;
}

/** Текст ошибок поля. id нужно связать с полем через aria-describedby */
@Component({
  selector: 'app-field-errors',
  template: `
    @if (visible()) {
      <span class="field-error">{{ message() }}</span>
    }
  `,
  host: { '[attr.id]': 'id()', 'aria-live': 'polite' },
})
export class FieldErrors {
  readonly state = input.required<FieldErrorsState>();
  readonly id = input.required<string>();

  protected readonly visible = computed(() => this.state().touched() && this.state().errors().length > 0);
  protected readonly message = computed(() => this.state().errors()[0]?.message ?? 'Invalid value');
}
