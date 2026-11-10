import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { hasPermission, Permission } from '@core/auth/permissions';
import { AuthGateway } from '@core/data/auth-gateway';
import { SignUpData, User } from '@shared/models';

/** Текущий пользователь и операции входа/выхода */
@Service()
export class AuthService {
  private readonly gateway = inject(AuthGateway);
  private readonly router = inject(Router);

  private readonly currentUser = signal<User | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly role = computed(() => this.currentUser()?.role ?? null);
  readonly isStaff = computed(() => {
    const role = this.role();
    return role === 'admin' || role === 'agent';
  });

  can(permission: Permission): boolean {
    const role = this.role();
    return role !== null && hasPermission(role, permission);
  }

  /** Восстановление сессии при старте приложения */
  async restore(): Promise<void> {
    try {
      this.currentUser.set(await this.gateway.currentUser());
    } catch {
      this.currentUser.set(null);
    }
  }

  async login(email: string, password: string): Promise<User> {
    const user = await this.gateway.signIn(email, password);
    this.currentUser.set(user);
    return user;
  }

  async register(data: SignUpData): Promise<User> {
    const user = await this.gateway.signUp(data);
    this.currentUser.set(user);
    return user;
  }

  async logout(): Promise<void> {
    await this.gateway.signOut();
    this.currentUser.set(null);
    await this.router.navigateByUrl('/login');
  }

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.currentUser();
    if (!user) return Promise.reject(new Error('Not signed in'));
    return this.gateway.changePassword(user.id, currentPassword, newPassword);
  }

  /** После редактирования профиля */
  setUser(user: User): void {
    if (this.currentUser()?.id === user.id) this.currentUser.set(user);
  }
}
