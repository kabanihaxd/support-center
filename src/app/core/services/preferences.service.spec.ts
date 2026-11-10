import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DEMO_PASSWORD } from '@core/data/demo-accounts';
import { DemoSeeder } from '@core/data/local/demo-seeder';
import { DATA_LATENCY } from '@core/data/local/latency';
import { provideLocalData } from '@core/data/local/provide-local-data';
import { PreferencesRepository } from '@core/data/repositories';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { PreferencesService } from './preferences.service';
import { TicketService } from './ticket.service';

describe('PreferencesService', () => {
  let prefs: PreferencesService;
  let auth: AuthService;

  /** Дождаться загрузки настроек после входа (effect + асинхронный репозиторий) */
  const loaded = async () => {
    for (let i = 0; i < 20 && !prefs.preferences(); i++) {
      TestBed.tick();
      await new Promise((r) => setTimeout(r));
    }
    expect(prefs.preferences()).not.toBeNull();
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideLocalData(), { provide: DATA_LATENCY, useValue: { min: 0, max: 0 } }],
    });
    TestBed.inject(DemoSeeder).ensureSeeded();
    prefs = TestBed.inject(PreferencesService);
    auth = TestBed.inject(AuthService);
  });

  it('loads defaults, persists changes and applies table density', async () => {
    await auth.login('customer@supportcenter.dev', DEMO_PASSWORD);
    await loaded();
    expect(prefs.preferences()?.compactTables).toBe(false);

    await prefs.update({ compactTables: true });
    TestBed.tick();
    expect(document.documentElement.dataset['density']).toBe('compact');
    const stored = await TestBed.inject(PreferencesRepository).get(auth.user()!.id);
    expect(stored.compactTables).toBe(true);
    // Остальные настройки не затёрты
    expect(stored.notifications).toEqual({ assigned: true, comment: true, status: true });
  });

  it('rolls back when saving fails', async () => {
    await auth.login('customer@supportcenter.dev', DEMO_PASSWORD);
    await loaded();
    const repo = TestBed.inject(PreferencesRepository);
    vi.spyOn(repo, 'save').mockRejectedValueOnce(new Error('offline'));
    await expect(prefs.update({ compactTables: true })).rejects.toThrow('offline');
    expect(prefs.preferences()?.compactTables).toBe(false);
  });

  it('respects disabled notification types for the recipient', async () => {
    // Клиент отключает уведомления о статусе
    await auth.login('customer@supportcenter.dev', DEMO_PASSWORD);
    await loaded();
    const customerId = auth.user()!.id;
    await prefs.update({ notifications: { assigned: true, comment: true, status: false } });

    // Агент меняет статус тикета клиента — уведомление не создаётся
    await auth.login('agent@supportcenter.dev', DEMO_PASSWORD);
    const tickets = TestBed.inject(TicketService);
    await tickets.load();
    const ticket = tickets.tickets().find((t) => t.customerId === customerId && t.status === 'open')!;
    const notifications = TestBed.inject(NotificationService);
    const spy = vi.spyOn(notifications, 'notify');
    await tickets.changeStatus(ticket, 'in_progress');
    expect(spy).toHaveBeenCalledWith(customerId, 'status', ticket.id, expect.any(String));

    await auth.login('customer@supportcenter.dev', DEMO_PASSWORD);
    await notifications.load(customerId);
    expect(notifications.notifications().some((n) => n.ticketId === ticket.id && n.type === 'status')).toBe(false);
  });
});
