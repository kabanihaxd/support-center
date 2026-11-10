import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import {
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { User } from '@shared/models';
import { FieldErrors } from '../field-errors/field-errors';
import { Icon } from '../icon/icon';
import { Modal } from '../modal/modal';

export type UserFormMode = 'create-staff' | 'edit';

export interface UserFormValue {
  name: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  role: 'agent' | 'admin';
  password: string;
}

const EMPTY: UserFormValue = { name: '', email: '', phone: '', company: '', jobTitle: '', role: 'agent', password: '' };

/** Диалог создания специалиста / редактирования профиля. Сохранение выполняет родитель */
@Component({
  selector: 'app-user-form-dialog',
  imports: [Modal, FormField, FormRoot, FieldErrors, Icon],
  templateUrl: './user-form-dialog.html',
  styles: `
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .footer { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-2); }
    .readonly { padding: var(--space-2) 0; color: var(--text-muted); }
    @media (max-width: 520px) { .row { grid-template-columns: 1fr; } }
  `,
})
export class UserFormDialog {
  readonly open = input(false);
  readonly mode = input<UserFormMode>('edit');
  readonly user = input<User | null>(null);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  /** Можно ли менять роль (Admin редактирует другого сотрудника) */
  readonly canChangeRole = input(false);

  readonly save = output<UserFormValue>();
  readonly closed = output<void>();

  protected readonly isCreate = computed(() => this.mode() === 'create-staff');
  protected readonly isCustomer = computed(() => this.user()?.role === 'customer');
  protected readonly title = computed(() => {
    if (this.isCreate()) return 'Add team member';
    return this.isCustomer() ? 'Edit customer' : 'Edit profile';
  });

  protected readonly model = signal<UserFormValue>({ ...EMPTY });
  protected readonly form = form(
    this.model,
    (p) => {
      required(p.name, { message: 'Name is required' });
      minLength(p.name, 2, { message: 'Name must be at least 2 characters' });
      maxLength(p.name, 80, { message: 'Name must be at most 80 characters' });
      required(p.email, { message: 'Email is required', when: () => this.isCreate() });
      email(p.email, { message: 'Enter a valid email address' });
      required(p.password, { message: 'Set a temporary password', when: () => this.isCreate() });
      // Пароль задаётся только при создании; при редактировании поле скрыто и не проверяется
      validate(p.password, ({ value }) => {
        const v = value();
        if (!this.isCreate() || !v) return undefined;
        if (v.length < 8) return { kind: 'minLength', message: 'Use at least 8 characters' };
        if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) {
          return { kind: 'pattern', message: 'Use at least one letter and one number' };
        }
        return undefined;
      });
      pattern(p.phone, /^[+\d\s()-]*$/, { message: 'Use digits, spaces and + ( ) - only' });
      maxLength(p.phone, 24, { message: 'Phone must be at most 24 characters' });
      maxLength(p.company, 80, { message: 'Company must be at most 80 characters' });
      maxLength(p.jobTitle, 60, { message: 'Job title must be at most 60 characters' });
    },
    {
      submission: {
        action: async () => {
          this.save.emit({ ...this.model() });
          return undefined;
        },
      },
    },
  );

  constructor() {
    // При каждом открытии заполняем форму заново
    effect(() => {
      if (!this.open()) return;
      const user = this.user();
      untracked(() => {
        const value: UserFormValue = user
          ? {
              ...EMPTY,
              name: user.name,
              email: user.email,
              phone: user.phone ?? '',
              company: user.company ?? '',
              jobTitle: user.jobTitle ?? '',
              role: user.role === 'admin' ? 'admin' : 'agent',
            }
          : { ...EMPTY };
        this.form().reset(value);
      });
    });
  }
}
