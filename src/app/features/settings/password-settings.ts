import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, minLength, pattern, required, validate } from '@angular/forms/signals';
import { errorMessage } from '@core/errors/app-error';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { FieldErrors } from '@shared/components/field-errors/field-errors';
import { Icon } from '@shared/components/icon/icon';

interface PasswordModel {
  current: string;
  next: string;
  confirm: string;
}

const EMPTY: PasswordModel = { current: '', next: '', confirm: '' };

/** Смена пароля: текущий пароль + новый (те же правила, что при регистрации) */
@Component({
  selector: 'app-password-settings',
  imports: [FieldErrors, FormField, FormRoot, Icon],
  template: `
    <section class="card" id="security" aria-labelledby="security-title">
      <div class="card-header">
        <div>
          <h2 id="security-title">Password</h2>
          <p class="muted sub">Use at least 8 characters with a letter and a number.</p>
        </div>
      </div>
      <form class="card-body form-grid" [formRoot]="form" aria-labelledby="security-title">
        @if (serverError(); as error) {
          <div class="alert" role="alert">
            <app-icon name="circle-alert" [size]="16" />
            {{ error }}
          </div>
        }

        <div class="field narrow">
          <label class="field-label" for="pwd-current">Current password</label>
          <input
            id="pwd-current"
            class="input"
            [type]="show() ? 'text' : 'password'"
            autocomplete="current-password"
            [formField]="form.current"
            aria-describedby="pwd-current-error"
            [attr.aria-invalid]="form.current().touched() && form.current().invalid()"
          />
          <app-field-errors id="pwd-current-error" [state]="form.current()" />
        </div>

        <div class="row">
          <div class="field">
            <label class="field-label" for="pwd-next">New password</label>
            <input
              id="pwd-next"
              class="input"
              [type]="show() ? 'text' : 'password'"
              autocomplete="new-password"
              [formField]="form.next"
              aria-describedby="pwd-next-error"
              [attr.aria-invalid]="form.next().touched() && form.next().invalid()"
            />
            <app-field-errors id="pwd-next-error" [state]="form.next()" />
          </div>
          <div class="field">
            <label class="field-label" for="pwd-confirm">Confirm new password</label>
            <input
              id="pwd-confirm"
              class="input"
              [type]="show() ? 'text' : 'password'"
              autocomplete="new-password"
              [formField]="form.confirm"
              aria-describedby="pwd-confirm-error"
              [attr.aria-invalid]="form.confirm().touched() && form.confirm().invalid()"
            />
            <app-field-errors id="pwd-confirm-error" [state]="form.confirm()" />
          </div>
        </div>

        <label class="checkbox">
          <input type="checkbox" [checked]="show()" (change)="show.set(!show())" />
          Show passwords
        </label>

        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="form().submitting()">
            @if (form().submitting()) {
              <app-icon name="loader" [size]="16" class="spin" />
              Updating…
            } @else {
              Update password
            }
          </button>
        </div>
      </form>
    </section>
  `,
  styleUrl: './settings-section.css',
})
export class PasswordSettings {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly serverError = signal<string | null>(null);
  protected readonly show = signal(false);
  private readonly model = signal<PasswordModel>({ ...EMPTY });

  protected readonly form = form(
    this.model,
    (p) => {
      required(p.current, { message: 'Enter your current password' });
      required(p.next, { message: 'Enter a new password' });
      minLength(p.next, 8, { message: 'Use at least 8 characters' });
      pattern(p.next, /^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'Use at least one letter and one number' });
      validate(p.next, ({ value, valueOf }) =>
        value() && value() === valueOf(p.current)
          ? { kind: 'same', message: 'New password must be different from the current one' }
          : undefined,
      );
      required(p.confirm, { message: 'Please confirm the new password' });
      validate(p.confirm, ({ value, valueOf }) =>
        value() && value() !== valueOf(p.next) ? { kind: 'mismatch', message: 'Passwords do not match' } : undefined,
      );
    },
    { submission: { action: async () => (await this.save(), undefined) } },
  );

  private async save(): Promise<void> {
    this.serverError.set(null);
    const { current, next } = this.model();
    try {
      await this.auth.changePassword(current, next);
      this.form().reset({ ...EMPTY });
      this.show.set(false);
      this.toast.success('Your password has been changed.');
    } catch (error) {
      this.serverError.set(errorMessage(error));
    }
  }
}
