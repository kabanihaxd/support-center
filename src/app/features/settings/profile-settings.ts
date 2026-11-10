import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { form, FormField, FormRoot, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { errorMessage } from '@core/errors/app-error';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { UserAdminService } from '@core/services/user-admin.service';
import { Avatar } from '@shared/components/avatar/avatar';
import { RoleBadge } from '@shared/components/badges/user-badges';
import { FieldErrors } from '@shared/components/field-errors/field-errors';
import { Icon } from '@shared/components/icon/icon';

interface ProfileModel {
  name: string;
  phone: string;
  /** Компания (клиент) или должность (сотрудник) */
  extra: string;
}

/** Свой профиль: имя, телефон, компания/должность. Email и роль меняет только администратор */
@Component({
  selector: 'app-profile-settings',
  imports: [Avatar, RoleBadge, FieldErrors, FormField, FormRoot, Icon],
  template: `
    @if (auth.user(); as user) {
      <section class="card" id="profile" aria-labelledby="profile-title">
        <div class="card-header">
          <div>
            <h2 id="profile-title">Profile</h2>
            <p class="muted sub">How you appear to customers and teammates.</p>
          </div>
        </div>
        <form class="card-body form-grid" [formRoot]="form" aria-labelledby="profile-title">
          <div class="identity">
            <app-avatar [name]="model().name || user.name" [size]="56" />
            <div class="who">
              <span class="email">{{ user.email }}</span>
              <app-role-badge [role]="user.role" />
            </div>
          </div>

          @if (serverError(); as error) {
            <div class="alert" role="alert">
              <app-icon name="circle-alert" [size]="16" />
              {{ error }}
            </div>
          }

          <div class="row">
            <div class="field">
              <label class="field-label" for="profile-name">Full name</label>
              <input
                id="profile-name"
                class="input"
                autocomplete="name"
                [formField]="form.name"
                aria-describedby="profile-name-error"
                [attr.aria-invalid]="form.name().touched() && form.name().invalid()"
              />
              <app-field-errors id="profile-name-error" [state]="form.name()" />
            </div>
            <div class="field">
              <label class="field-label" for="profile-phone">Phone <span class="muted">(optional)</span></label>
              <input
                id="profile-phone"
                class="input"
                type="tel"
                autocomplete="tel"
                placeholder="+1 555 010 2030"
                [formField]="form.phone"
                aria-describedby="profile-phone-error"
                [attr.aria-invalid]="form.phone().touched() && form.phone().invalid()"
              />
              <app-field-errors id="profile-phone-error" [state]="form.phone()" />
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label class="field-label" for="profile-extra">
                {{ isCustomer() ? 'Company' : 'Job title' }} <span class="muted">(optional)</span>
              </label>
              <input
                id="profile-extra"
                class="input"
                [attr.autocomplete]="isCustomer() ? 'organization' : 'organization-title'"
                [formField]="form.extra"
                aria-describedby="profile-extra-error"
                [attr.aria-invalid]="form.extra().touched() && form.extra().invalid()"
              />
              <app-field-errors id="profile-extra-error" [state]="form.extra()" />
            </div>
            <div class="field">
              <span class="field-label">Email</span>
              <p class="readonly">{{ user.email }}</p>
              <span class="field-hint">Contact an administrator to change your email.</span>
            </div>
          </div>

          <div class="actions">
            <button type="button" class="btn btn-secondary" [disabled]="!form().dirty() || form().submitting()" (click)="resetForm()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="!form().dirty() || form().submitting()">
              @if (form().submitting()) {
                <app-icon name="loader" [size]="16" class="spin" />
                Saving…
              } @else {
                Save changes
              }
            </button>
          </div>
        </form>
      </section>
    }
  `,
  styleUrl: './settings-section.css',
})
export class ProfileSettings {
  protected readonly auth = inject(AuthService);
  private readonly admin = inject(UserAdminService);
  private readonly toast = inject(ToastService);

  protected readonly serverError = signal<string | null>(null);
  protected readonly isCustomer = computed(() => this.auth.role() === 'customer');
  protected readonly model = signal<ProfileModel>({ name: '', phone: '', extra: '' });

  protected readonly form = form(
    this.model,
    (p) => {
      required(p.name, { message: 'Full name is required' });
      minLength(p.name, 2, { message: 'Name must be at least 2 characters' });
      maxLength(p.name, 80, { message: 'Name must be at most 80 characters' });
      pattern(p.phone, /^[+\d\s().-]{0,24}$/, { message: 'Use digits, spaces and + ( ) - only' });
      maxLength(p.extra, 80, { message: 'Must be at most 80 characters' });
    },
    { submission: { action: async () => (await this.save(), undefined) } },
  );

  constructor() {
    // Заполняем форму из текущего пользователя (и после сохранения — из обновлённого)
    effect(() => {
      const user = this.auth.user();
      untracked(() => user && this.resetForm());
    });
  }

  protected resetForm(): void {
    const user = this.auth.user();
    if (!user) return;
    this.serverError.set(null);
    this.form().reset({
      name: user.name,
      phone: user.phone ?? '',
      extra: (user.role === 'customer' ? user.company : user.jobTitle) ?? '',
    });
  }

  private async save(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    this.serverError.set(null);
    const { name, phone, extra } = this.model();
    try {
      await this.admin.updateProfile(user, {
        name,
        phone,
        ...(user.role === 'customer' ? { company: extra } : { jobTitle: extra }),
      });
      this.toast.success('Your profile has been updated.');
    } catch (error) {
      this.serverError.set(errorMessage(error));
    }
  }
}
