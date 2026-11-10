import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthGateway } from '@core/data/auth-gateway';
import { DEMO_PASSWORD } from '@core/data/demo-accounts';
import { DemoSeeder } from '@core/data/local/demo-seeder';
import { DATA_LATENCY } from '@core/data/local/latency';
import { provideLocalData } from '@core/data/local/provide-local-data';
import { AuthService } from './auth.service';
import { UserAdminService } from './user-admin.service';
import { UserDirectory } from './user-directory.service';

describe('UserAdminService', () => {
  let service: UserAdminService;
  let auth: AuthService;
  let directory: UserDirectory;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideLocalData(), { provide: DATA_LATENCY, useValue: { min: 0, max: 0 } }],
    });
    TestBed.inject(DemoSeeder).ensureSeeded();
    service = TestBed.inject(UserAdminService);
    auth = TestBed.inject(AuthService);
    directory = TestBed.inject(UserDirectory);
  });

  const asAdmin = async () => {
    await auth.login('admin@supportcenter.dev', DEMO_PASSWORD);
    await directory.load();
  };

  it('lets an admin create an agent who can then sign in', async () => {
    await asAdmin();
    const agent = await service.createStaff({
      name: 'New Agent',
      email: 'new.agent@supportcenter.dev',
      password: 'Welcome123',
      role: 'agent',
      jobTitle: 'L1 Support',
    });
    expect(directory.byId().get(agent.id)?.jobTitle).toBe('L1 Support');
    // Сессия админа не меняется
    expect(auth.user()?.email).toBe('admin@supportcenter.dev');
    const signedIn = await TestBed.inject(AuthGateway).signIn('new.agent@supportcenter.dev', 'Welcome123');
    expect(signedIn.role).toBe('agent');
  });

  it('forbids agents from creating staff or managing customers', async () => {
    await auth.login('agent@supportcenter.dev', DEMO_PASSWORD);
    await directory.load();
    await expect(
      service.createStaff({ name: 'X', email: 'x@x.dev', password: 'Welcome123', role: 'agent', jobTitle: '' }),
    ).rejects.toThrowError("You don't have permission");
    const customer = directory.customers()[0];
    await expect(service.setActive(customer, false)).rejects.toThrowError();
  });

  it('deactivates and reactivates a customer', async () => {
    await asAdmin();
    const customer = directory.byId().get('usr_cust_2')!;
    expect((await service.setActive(customer, false)).active).toBe(false);
    await expect(TestBed.inject(AuthGateway).signIn(customer.email, DEMO_PASSWORD)).rejects.toThrowError('deactivated');
    expect((await service.setActive(customer, true)).active).toBe(true);
  });

  it('protects the admin from locking themselves out', async () => {
    await asAdmin();
    const me = auth.user()!;
    await expect(service.setActive(me, false)).rejects.toThrowError("can't deactivate your own account");
    await expect(service.updateProfile(me, { name: me.name, role: 'agent' })).rejects.toThrowError("own role");
  });

  it('keeps at least one active admin', async () => {
    await asAdmin();
    const promoted = await service.updateProfile(directory.byId().get('usr_agent_2')!, { name: 'Sophia Martinez', role: 'admin' });
    expect(promoted.role).toBe('admin');
    // Теперь админов двое — понизить второго можно
    const demoted = await service.updateProfile(promoted, { name: promoted.name, role: 'agent' });
    expect(demoted.role).toBe('agent');
  });

  it('lets any user edit their own profile but not others', async () => {
    await auth.login('customer@supportcenter.dev', DEMO_PASSWORD);
    await directory.load();
    const me = auth.user()!;
    const updated = await service.updateProfile(me, { name: 'Emma W.', company: 'Northwind', phone: '+1 555 0100' });
    expect(auth.user()?.name).toBe('Emma W.');
    expect(updated.company).toBe('Northwind');
    const other = directory.byId().get('usr_cust_2')!;
    await expect(service.updateProfile(other, { name: 'Hacked' })).rejects.toThrowError();
  });
});
