import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { Icon } from '../icon/icon';

let nextId = 0;

/**
 * Модальное окно на нативном <dialog>: фокус-ловушка, Esc и возврат фокуса — от браузера.
 * Содержимое — через <ng-content>; кнопки футера — через [modal-footer].
 */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  template: `
    <dialog #dialog class="modal" [attr.aria-labelledby]="titleId" (cancel)="onCancel($event)" (close)="onNativeClose()">
      @if (open()) {
        <header class="head">
          <div>
            <h2 [id]="titleId">{{ title() }}</h2>
            @if (description()) {
              <p class="muted">{{ description() }}</p>
            }
          </div>
          <button type="button" class="icon-btn" aria-label="Close dialog" (click)="closed.emit()">
            <app-icon name="x" />
          </button>
        </header>
        <div class="body">
          <ng-content />
        </div>
      }
    </dialog>
  `,
  styles: `
    .modal {
      width: min(var(--modal-width, 520px), calc(100vw - 2rem));
      max-height: calc(100vh - 2rem);
      padding: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
      color: var(--text);
      box-shadow: var(--shadow-lg);
    }
    .modal::backdrop { background: var(--overlay); }
    .head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-5) var(--space-5) 0 var(--space-6);
    }
    .head p { margin-top: var(--space-1); }
    .body { padding: var(--space-5) var(--space-6) var(--space-6); }
  `,
})
export class Modal {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input('');
  readonly closed = output<void>();

  protected readonly titleId = `modal-title-${nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  /** Esc — закрываем через родителя, чтобы состояние оставалось в одном месте */
  protected onCancel(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }

  protected onNativeClose(): void {
    if (this.open()) this.closed.emit();
  }
}
