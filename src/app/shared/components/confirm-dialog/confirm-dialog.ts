import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { ConfirmService } from '@core/services/confirm.service';

/**
 * Модальное подтверждение на нативном <dialog>: ловушка фокуса, Esc и
 * возврат фокуса на кнопку-источник браузер обеспечивает сам.
 */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <dialog
      #dialog
      class="dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      (cancel)="answer(false, $event)"
      (click)="onBackdrop($event)"
    >
      @if (confirm.request(); as req) {
        <div class="content">
          <h2 id="confirm-title">{{ req.title }}</h2>
          <p id="confirm-message" class="muted">{{ req.message }}</p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-secondary" (click)="answer(false)">{{ req.cancelText }}</button>
          <button
            type="button"
            class="btn"
            [class.btn-danger]="req.tone === 'danger'"
            [class.btn-primary]="req.tone !== 'danger'"
            (click)="answer(true)"
            autofocus
          >
            {{ req.confirmText }}
          </button>
        </div>
      }
    </dialog>
  `,
  styles: `
    .dialog {
      width: min(440px, calc(100vw - 2rem));
      padding: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
      color: var(--text);
      box-shadow: var(--shadow-lg);
    }
    .dialog::backdrop {
      background: var(--overlay);
    }
    .content {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-6) var(--space-6) var(--space-4);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
      background: var(--surface-2);
      border-top: 1px solid var(--border);
    }
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.confirm.request() && !el.open) el.showModal();
      if (!this.confirm.request() && el.open) el.close();
    });
  }

  protected answer(confirmed: boolean, event?: Event): void {
    event?.preventDefault();
    this.confirm.request()?.resolve(confirmed);
  }

  /** Клик по затемнению (вне содержимого) = отмена */
  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.answer(false);
  }
}
