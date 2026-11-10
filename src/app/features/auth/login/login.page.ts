import { Component, inject, input, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DemoAccount } from '@core/data/demo-accounts';
import { errorMessage } from '@core/errors/app-error';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { FieldErrors } from '@shared/components/field-errors/field-errors';
import { Icon } from '@shared/components/icon/icon';
import { AuthLayout } from '../auth-layout/auth-layout';
import { safeReturnUrl } from '../safe-return-url';
import { DemoAccounts } from './demo-accounts';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-page',
  imports: [AuthLayout, FormField, FormRoot, FieldErrors, Icon, RouterLink, DemoAccounts],
  templateUrl: './login.page.html',
  styleUrl: '../auth-form.css',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** ?returnUrl= из authGuard */
  readonly returnUrl = input<string>();

  protected readonly demoAccounts = DEMO_ACCOUNTS;
  protected readonly showPassword = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Email демо-аккаунта, под которым сейчас выполняется вход */
  protected readonly demoBusy = signal<string | null>(null);

  private readonly model = signal<LoginModel>({ email: '', password: '' });
  protected readonly form = form(
    this.model,
    (p) => {
      required(p.email, { message: 'Email is required' });
      email(p.email, { message: 'Enter a valid email address' });
      required(p.password, { message: 'Password is required' });
    },
    {
      submission: {
        action: async () => {
          await this.signIn(this.model().email, this.model().password);
          return undefined;
        },
      },
    },
  );

  /** Быстрый вход под демо-аккаунтом */
  protected async useDemo(account: DemoAccount): Promise<void> {
    if (this.demoBusy()) return;
    this.demoBusy.set(account.email);
    this.model.set({ email: account.email, password: DEMO_PASSWORD });
    try {
      await this.signIn(account.email, DEMO_PASSWORD);
    } finally {
      this.demoBusy.set(null);
    }
  }

  private async signIn(emailValue: string, password: string): Promise<void> {
    this.serverError.set(null);
    try {
      const user = await this.auth.login(emailValue, password);
      this.toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
    } catch (error) {
      this.serverError.set(errorMessage(error));
    }
  }
}
