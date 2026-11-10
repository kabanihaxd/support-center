import { inject, Service } from '@angular/core';
import { hasPermission, Permission } from '@core/auth/permissions';
import { AuthGateway } from '@core/data/auth-gateway';
import { UserRepository } from '@core/data/repositories';
import { AppError } from '@core/errors/app-error';
import { User, UserRole } from '@shared/models';
import { AuthService } from './auth.service';
import { UserDirectory } from './user-directory.service';

export interface NewStaffData {
  name: string;
  email: string;
  password: string;
  role: 'agent' | 'admin';
  jobTitle: string;
}

export interface ProfilePatch {
  name: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  role?: UserRole;
}

/** Управление пользователями: создание специалистов, редактирование, блокировка */
@Service()
export class UserAdminService {
  private readonly repo = inject(UserRepository);
  private readonly gateway = inject(AuthGateway);
  private readonly auth = inject(AuthService);
  private readonly directory = inject(UserDirectory);

  /** Только Admin создаёт учётные записи сотрудников */
  async createStaff(data: NewStaffData): Promise<User> {
    this.require('agent.manage');
    const user = await this.gateway.createAccount({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      jobTitle: data.jobTitle,
    });
    this.directory.upsert(user);
    return user;
  }

  /** Редактирование профиля: Admin — любого, пользователь — свой (без смены роли) */
  async updateProfile(target: User, patch: ProfilePatch): Promise<User> {
    const me = this.requireUser();
    const isSelf = me.id === target.id;
    if (!isSelf) this.require(this.managePermission(target));

    const changes: Partial<Omit<User, 'id'>> = { name: patch.name.trim() };
    if (patch.phone !== undefined) changes.phone = patch.phone.trim();
    if (target.role === 'customer' && patch.company !== undefined) changes.company = patch.company.trim();
    if (target.role !== 'customer' && patch.jobTitle !== undefined) changes.jobTitle = patch.jobTitle.trim();

    if (patch.role && patch.role !== target.role) {
      if (isSelf) throw new AppError('forbidden', "You can't change your own role.");
      if (target.role === 'customer' || patch.role === 'customer') {
        throw new AppError('validation', 'Customers and staff accounts cannot be converted into each other.');
      }
      if (target.role === 'admin') this.ensureAnotherAdmin(target);
      changes.role = patch.role;
    }

    const updated = await this.repo.update(target.id, changes);
    this.directory.upsert(updated);
    this.auth.setUser(updated);
    return updated;
  }

  async setActive(target: User, active: boolean): Promise<User> {
    const me = this.requireUser();
    this.require(this.managePermission(target));
    if (me.id === target.id) throw new AppError('forbidden', "You can't deactivate your own account.");
    if (!active && target.role === 'admin') this.ensureAnotherAdmin(target);
    const updated = await this.repo.update(target.id, { active });
    this.directory.upsert(updated);
    return updated;
  }

  /** В системе всегда должен остаться хотя бы один активный администратор */
  private ensureAnotherAdmin(target: User): void {
    const others = this.directory.users().filter((u) => u.role === 'admin' && u.active && u.id !== target.id);
    if (!others.length) throw new AppError('validation', 'At least one active admin is required.');
  }

  private managePermission(target: User): Permission {
    return target.role === 'customer' ? 'customer.manage' : 'agent.manage';
  }

  private requireUser(): User {
    const user = this.auth.user();
    if (!user) throw new AppError('unauthorized', 'Please sign in again.');
    return user;
  }

  private require(permission: Permission): void {
    if (!hasPermission(this.requireUser().role, permission)) {
      throw new AppError('forbidden', "You don't have permission to perform this action.");
    }
  }
}
