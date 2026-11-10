import { ErrorHandler, inject, Injectable } from '@angular/core';
import { errorMessage } from '@core/errors/app-error';
import { ToastService } from './toast.service';

/** Необработанные ошибки: логируем и показываем понятный toast вместо «тишины» */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);

  handleError(error: unknown): void {
    console.error(error);
    this.toast.error(errorMessage(error, 'Unexpected error. Please reload the page and try again.'));
  }
}
