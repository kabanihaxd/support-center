import { Component, inject } from '@angular/core';
import { ToastKind, ToastService } from '@core/services/toast.service';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

const ICON_BY_KIND: Record<ToastKind, IconName> = {
  success: 'circle-check',
  error: 'circle-alert',
  warning: 'warning',
  info: 'info',
};

@Component({
  selector: 'app-toast-container',
  imports: [Icon],
  // Отдельная landmark-область, чтобы всплывающие сообщения не оказались «вне landmarks»
  host: { role: 'region', 'aria-label': 'Status messages' },
  template: `
    <!-- Отдельные live-регионы: ошибки — assertive, остальное — polite -->
    <div class="sr-only" aria-live="assertive" role="alert">
      @for (t of toast.toasts(); track t.id) {
        @if (t.kind === 'error') {
          <p>{{ t.message }}</p>
        }
      }
    </div>
    <div class="sr-only" aria-live="polite" role="status">
      @for (t of toast.toasts(); track t.id) {
        @if (t.kind !== 'error') {
          <p>{{ t.message }}</p>
        }
      }
    </div>
    <ol class="stack" aria-label="Messages">
      @for (t of toast.toasts(); track t.id) {
        <li [class]="'toast toast-' + t.kind">
          <app-icon [name]="icons[t.kind]" [size]="18" />
          <p class="message">{{ t.message }}</p>
          <button type="button" class="icon-btn close" aria-label="Dismiss notification" (click)="toast.dismiss(t.id)">
            <app-icon name="x" [size]="16" />
          </button>
        </li>
      }
    </ol>
  `,
  styles: `
    .stack {
      position: fixed;
      right: var(--space-4);
      bottom: var(--space-4);
      z-index: 1000;
      display: grid;
      gap: var(--space-2);
      width: min(380px, calc(100vw - 2rem));
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-2) var(--space-3) var(--space-4);
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      animation: slide-in 0.2s ease-out;
    }
    .toast app-icon {
      color: var(--accent);
      margin-top: 1px;
    }
    .message {
      flex: 1;
      font-size: var(--fs-md);
      padding-top: 1px;
    }
    .close {
      width: 28px;
      height: 28px;
      margin-top: -4px;
    }
    .toast-success { --accent: var(--success-text); }
    .toast-error { --accent: var(--danger-text); }
    .toast-warning { --accent: var(--warning-text); }
    .toast-info { --accent: var(--info-text); }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
  `,
})
export class ToastContainer {
  protected readonly toast = inject(ToastService);
  protected readonly icons = ICON_BY_KIND;
}
