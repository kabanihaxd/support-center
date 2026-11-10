import { computed, inject, Injectable, signal } from '@angular/core';
import { errorMessage } from '@core/errors/app-error';
import { AuthService } from '@core/services/auth.service';
import { ConfirmService } from '@core/services/confirm.service';
import { TicketService } from '@core/services/ticket.service';
import { ToastService } from '@core/services/toast.service';
import { UserAdminService } from '@core/services/user-admin.service';
import { isActive } from '@core/domain/ticket-rules';
import { UserFormMode, UserFormValue } from '@shared/components/user-form-dialog/user-form-dialog';
import { User } from '@shared/models';

/**
 * Действия над пользователями для страниц Customers/Agents: диалог редактирования,
 * создание специалиста, блокировка с подтверждением. Предоставляется на уровне страницы.
 */
@Injectable()
export class UserActionsController {
  private readonly admin = inject(UserAdminService);
  private readonly auth = inject(AuthService);
  private readonly tickets = inject(TicketService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly dialogOpen = signal(false);
  readonly mode = signal<UserFormMode>('edit');
  readonly target = signal<User | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  /** id пользователя, у которого сейчас меняется статус */
  readonly toggling = signal<string | null>(null);

  readonly canChangeRole = computed(() => {
    const target = this.target();
    return !!target && target.role !== 'customer' && target.id !== this.auth.user()?.id;
  });

  canManage(user: User): boolean {
    return this.auth.can(user.role === 'customer' ? 'customer.manage' : 'agent.manage');
  }

  isSelf(user: User): boolean {
    return user.id === this.auth.user()?.id;
  }

  openCreate(): void {
    this.open('create-staff', null);
  }

  openEdit(user: User): void {
    this.open('edit', user);
  }

  close(): void {
    if (!this.saving()) this.dialogOpen.set(false);
  }

  async save(value: UserFormValue): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const target = this.target();
      if (this.mode() === 'create-staff') {
        const user = await this.admin.createStaff({
          name: value.name,
          email: value.email,
          password: value.password,
          role: value.role,
          jobTitle: value.jobTitle,
        });
        this.toast.success(`${user.name} was added to the team.`);
      } else if (target) {
        await this.admin.updateProfile(target, {
          name: value.name,
          phone: value.phone,
          company: value.company,
          jobTitle: value.jobTitle,
          role: target.role === 'customer' ? undefined : value.role,
        });
        this.toast.success('Profile updated.');
      }
      this.dialogOpen.set(false);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(user: User): Promise<void> {
    if (user.active) {
      const activeTickets = this.tickets.tickets().filter((t) => t.assigneeId === user.id && isActive(t)).length;
      const consequence =
        user.role === 'customer'
          ? 'They will no longer be able to sign in or create tickets.'
          : `They will no longer be able to sign in.${activeTickets ? ` ${activeTickets} active ticket(s) stay assigned to them — consider reassigning.` : ''}`;
      const confirmed = await this.confirm.ask({
        title: `Deactivate ${user.name}?`,
        message: `${consequence} You can reactivate the account at any time.`,
        confirmText: 'Deactivate',
        tone: 'danger',
      });
      if (!confirmed) return;
    }
    this.toggling.set(user.id);
    try {
      const updated = await this.admin.setActive(user, !user.active);
      this.toast.success(updated.active ? `${user.name} was reactivated.` : `${user.name} was deactivated.`);
    } catch (e) {
      this.toast.error(errorMessage(e));
    } finally {
      this.toggling.set(null);
    }
  }

  private open(mode: UserFormMode, user: User | null): void {
    this.mode.set(mode);
    this.target.set(user);
    this.error.set(null);
    this.dialogOpen.set(true);
  }
}
