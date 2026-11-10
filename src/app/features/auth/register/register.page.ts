import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, FormRoot, maxLength, minLength, pattern, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '@core/errors/app-error';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { FieldErrors } from '@shared/components/field-errors/field-errors';
import { Icon } from '@shared/components/icon/icon';
import { AuthLayout } from '../auth-layout/auth-layout';

interface RegisterModel {
  name: string;
  company: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register-page',
  imports: [AuthLayout, FormField, FormRoot, FieldErrors, Icon, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: '../auth-form.css',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly serverError = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  private readonly model = signal<RegisterModel>({
    name: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  protected readonly form = form(
    this.model,
    (p) => {
      required(p.name, { message: 'Full name is required' });
      minLength(p.name, 2, { message: 'Name must be at least 2 characters' });
      maxLength(p.name, 80, { message: 'Name must be at most 80 characters' });
      maxLength(p.company, 80, { message: 'Company must be at most 80 characters' });
      required(p.email, { message: 'Email is required' });
      email(p.email, { message: 'Enter a valid email address' });
      required(p.password, { message: 'Password is required' });
      minLength(p.password, 8, { message: 'Use at least 8 characters' });
      pattern(p.password, /^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'Use at least one letter and one number' });
      required(p.confirmPassword, { message: 'Please confirm your password' });
      validate(p.confirmPassword, ({ value, valueOf }) =>
        value() && value() !== valueOf(p.password) ? { kind: 'mismatch', message: 'Passwords do not match' } : undefined,
      );
    },
    {
      submission: {
        action: async () => {
          await this.register();
          return undefined;
        },
      },
    },
  );

  private async register(): Promise<void> {
    this.serverError.set(null);
    const { name, company, email: emailValue, password } = this.model();
    try {
      await this.auth.register({ name, email: emailValue, password, company: company || undefined });
      this.toast.success('Your account has been created. Welcome to SupportCenter!');
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      this.serverError.set(errorMessage(error));
    }
  }
}
