import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@core/services/theme.service';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { ToastContainer } from '@shared/components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, ConfirmDialog],
  template: `
    <router-outlet />
    <app-toast-container />
    <app-confirm-dialog />
  `,
})
export class App {
  constructor() {
    // Создаём сервис темы сразу, чтобы применить сохранённую тему
    inject(ThemeService);
  }
}
