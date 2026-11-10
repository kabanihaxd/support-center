import { Service, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const DURATION: Record<ToastKind, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 7000,
};

const MAX_TOASTS = 4;

@Service()
export class ToastService {
  private nextId = 1;
  private readonly items = signal<Toast[]>([]);
  readonly toasts = this.items.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }

  private show(kind: ToastKind, message: string): void {
    const toast: Toast = { id: this.nextId++, kind, message };
    this.items.update((list) => [...list, toast].slice(-MAX_TOASTS));
    setTimeout(() => this.dismiss(toast.id), DURATION[kind]);
  }
}
