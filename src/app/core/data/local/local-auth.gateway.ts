import { inject, Injectable } from '@angular/core';
import { AuthGateway, NewAccount } from '@core/data/auth-gateway';
import { UserRepository } from '@core/data/repositories';
import { AppError } from '@core/errors/app-error';
import { Clock } from '@core/services/clock';
import { SignUpData, User } from '@shared/models';
import { createId } from '@shared/utils/id';
import { DATA_LATENCY, simulateLatency } from './latency';
import { LocalStore } from './local-store';
import { createCredential, StoredCredential, verifyCredential } from './password-hash';
import { STORAGE_KEYS } from './storage-keys';

interface StoredSession {
  userId: string;
}

/** Mock-аутентификация: учётные данные и сессия в localStorage */
@Injectable()
export class LocalAuthGateway implements AuthGateway {
  private readonly store = inject(LocalStore);
  private readonly users = inject(UserRepository);
  private readonly clock = inject(Clock);
  private readonly latency = inject(DATA_LATENCY);

  async signIn(email: string, password: string): Promise<User> {
    await simulateLatency(this.latency);
    const credential = this.findCredential(email);
    if (!credential || !verifyCredential(credential, password)) {
      throw new AppError('unauthorized', 'Invalid email or password.');
    }
    const user = await this.users.getById(credential.userId);
    if (!user) throw new AppError('unauthorized', 'Invalid email or password.');
    if (!user.active) throw new AppError('forbidden', 'Your account is deactivated. Contact an administrator.');
    this.store.write<StoredSession>(STORAGE_KEYS.session, { userId: user.id });
    return user;
  }

  async signUp(data: SignUpData): Promise<User> {
    const user = await this.createAccount({ ...data, role: 'customer' });
    this.store.write<StoredSession>(STORAGE_KEYS.session, { userId: user.id });
    return user;
  }

  async signOut(): Promise<void> {
    this.store.remove(STORAGE_KEYS.session);
  }

  async currentUser(): Promise<User | null> {
    const session = this.store.read<StoredSession | null>(STORAGE_KEYS.session, null);
    if (!session) return null;
    const user = await this.users.getById(session.userId);
    if (!user || !user.active) {
      this.store.remove(STORAGE_KEYS.session);
      return null;
    }
    return user;
  }

  async createAccount(data: NewAccount): Promise<User> {
    const email = data.email.trim().toLowerCase();
    if (this.findCredential(email) || (await this.users.findByEmail(email))) {
      throw new AppError('conflict', 'An account with this email already exists.');
    }
    const user = await this.users.create({
      name: data.name.trim(),
      email,
      role: data.role,
      createdAt: this.clock.nowIso(),
      active: true,
      ...(data.jobTitle ? { jobTitle: data.jobTitle.trim() } : {}),
      ...(data.company ? { company: data.company.trim() } : {}),
    });
    const credentials = this.readCredentials();
    this.store.write(STORAGE_KEYS.credentials, [
      ...credentials,
      createCredential(user.id, email, data.password, createId('salt')),
    ]);
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await simulateLatency(this.latency);
    const credentials = this.readCredentials();
    const credential = credentials.find((c) => c.userId === userId);
    if (!credential || !verifyCredential(credential, currentPassword)) {
      throw new AppError('validation', 'Current password is incorrect.');
    }
    const updated = createCredential(userId, credential.email, newPassword, createId('salt'));
    this.store.write(
      STORAGE_KEYS.credentials,
      credentials.map((c) => (c.userId === userId ? updated : c)),
    );
  }

  private findCredential(email: string): StoredCredential | undefined {
    const normalized = email.trim().toLowerCase();
    return this.readCredentials().find((c) => c.email === normalized);
  }

  private readCredentials(): StoredCredential[] {
    return this.store.read<StoredCredential[]>(STORAGE_KEYS.credentials, []);
  }
}
