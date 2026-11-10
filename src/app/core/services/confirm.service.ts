import { Service, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'primary';
}

export interface ConfirmRequest extends Required<ConfirmOptions> {
  resolve: (confirmed: boolean) => void;
}

/** Диалог подтверждения: await confirm.ask({...}) → true/false */
@Service()
export class ConfirmService {
  private readonly current = signal<ConfirmRequest | null>(null);
  readonly request = this.current.asReadonly();

  ask(options: ConfirmOptions): Promise<boolean> {
    // Если уже открыт другой диалог — закрываем его как «отмена»
    this.current()?.resolve(false);
    return new Promise<boolean>((resolve) => {
      this.current.set({
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        tone: 'primary',
        ...options,
        resolve: (confirmed) => {
          this.current.set(null);
          resolve(confirmed);
        },
      });
    });
  }
}
