import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthGateway } from '@core/data/auth-gateway';
import { UserRepository } from '@core/data/repositories';
import { AppError } from '@core/errors/app-error';
import { Clock } from '@core/services/clock';
import { DEMO_PASSWORD } from '../demo-accounts';
import { DemoSeeder } from './demo-seeder';
import { DATA_LATENCY } from './latency';
import { LocalStore } from './local-store';
import { provideLocalData } from './provide-local-data';

describe('LocalAuthGateway', () => {
  let gateway: AuthGateway;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideLocalData(),
        { provide: DATA_LATENCY, useValue: { min: 0, max: 0 } },
        { provide: Clock, useValue: { now: () => new Date('2026-11-10T12:00:00Z'), nowIso: () => '2026-11-10T12:00:00.000Z' } },
      ],
    });
    TestBed.inject(DemoSeeder).ensureSeeded();
    gateway = TestBed.inject(AuthGateway);
  });

  it('signs in a demo account and restores the session', async () => {
    const user = await gateway.signIn('Admin@SupportCenter.dev ', DEMO_PASSWORD);
    expect(user.role).toBe('admin');
    expect((await gateway.currentUser())?.id).toBe(user.id);
  });

  it('rejects a wrong password with a generic message', async () => {
    await expect(gateway.signIn('admin@supportcenter.dev', 'wrong')).rejects.toThrowError('Invalid email or password.');
  });

  it('blocks deactivated users', async () => {
    const error = await gateway.signIn('mia.novak@supportcenter.dev', DEMO_PASSWORD).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('forbidden');
  });

  it('registers a new customer and prevents duplicate emails', async () => {
    const user = await gateway.signUp({ name: 'New Person', email: 'new@example.com', password: 'secret123' });
    expect(user.role).toBe('customer');
    expect((await gateway.currentUser())?.id).toBe(user.id);
    expect(await TestBed.inject(UserRepository).findByEmail('new@example.com')).not.toBeNull();
    await expect(gateway.signUp({ name: 'Dup', email: 'NEW@example.com', password: 'secret123' })).rejects.toThrowError(
      'An account with this email already exists.',
    );
  });

  it('signs out', async () => {
    await gateway.signIn('agent@supportcenter.dev', DEMO_PASSWORD);
    await gateway.signOut();
    expect(await gateway.currentUser()).toBeNull();
  });

  it('changes the password', async () => {
    const user = await gateway.signIn('agent@supportcenter.dev', DEMO_PASSWORD);
    await expect(gateway.changePassword(user.id, 'bad', 'NewPass123')).rejects.toThrowError();
    await gateway.changePassword(user.id, DEMO_PASSWORD, 'NewPass123');
    await expect(gateway.signIn('agent@supportcenter.dev', 'NewPass123')).resolves.toBeTruthy();
  });

  it('keeps the theme when demo data is reset', async () => {
    const store = TestBed.inject(LocalStore);
    store.write('theme', 'dark');
    await TestBed.inject(DemoSeeder).reset();
    expect(store.read('theme', 'light')).toBe('dark');
  });
});
