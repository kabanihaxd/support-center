import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DEMO_PASSWORD } from '@core/data/demo-accounts';
import { DemoSeeder } from '@core/data/local/demo-seeder';
import { DATA_LATENCY } from '@core/data/local/latency';
import { provideLocalData } from '@core/data/local/provide-local-data';
import {
  CommentRepository,
  NotificationRepository,
  PreferencesRepository,
  TicketEventRepository,
} from '@core/data/repositories';
import { AppError } from '@core/errors/app-error';
import { defaultPreferences } from '@shared/models/preferences.defaults';
import { AuthService } from './auth.service';
import { Clock } from './clock';
import { TicketService } from './ticket.service';

const NOW = '2026-11-10T12:00:00.000Z';

describe('TicketService', () => {
  let service: TicketService;
  let auth: AuthService;

  const signIn = (email: string) => auth.login(email, DEMO_PASSWORD);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideLocalData(),
        { provide: DATA_LATENCY, useValue: { min: 0, max: 0 } },
        { provide: Clock, useValue: { now: () => new Date(NOW), nowIso: () => NOW } },
      ],
    });
    TestBed.inject(DemoSeeder).ensureSeeded();
    service = TestBed.inject(TicketService);
    auth = TestBed.inject(AuthService);
  });

  it('shows customers only their own tickets and staff everything', async () => {
    await signIn('customer@supportcenter.dev');
    await service.load();
    const own = service.tickets();
    expect(own.length).toBeGreaterThan(0);
    expect(own.every((t) => t.customerId === 'usr_cust_1')).toBe(true);

    await signIn('agent@supportcenter.dev');
    await service.load();
    expect(service.tickets().length).toBe(84);
  });

  it('creates a ticket for the signed-in customer with SLA and history', async () => {
    const user = await signIn('customer@supportcenter.dev');
    const ticket = await service.create({
      title: 'Monitor flickers',
      description: 'The screen flickers every few seconds.',
      category: 'hardware',
      priority: 'critical',
      customerId: 'usr_cust_5', // клиент не может создать тикет от чужого имени
      assigneeId: 'usr_agent_2', // и не может назначать исполнителя
    });
    expect(ticket.id).toBe('TCK-1085');
    expect(ticket.customerId).toBe(user.id);
    expect(ticket.assigneeId).toBeNull();
    expect(ticket.status).toBe('open');
    expect(ticket.dueAt).toBe('2026-11-10T20:00:00.000Z');
    const events = await TestBed.inject(TicketEventRepository).listByTicket(ticket.id);
    expect(events.map((e) => e.type)).toEqual(['created']);
  });

  it('lets agents assign and change status, recording history and notifying', async () => {
    await signIn('agent@supportcenter.dev');
    const original = (await service.getById('TCK-1084'))!;
    const target = original.assigneeId === 'usr_agent_2' ? 'usr_agent_3' : 'usr_agent_2';
    const assigned = await service.assign(original, target);
    const resolved = await service.changeStatus(assigned, 'resolved');
    expect(resolved.resolvedAt).toBe(NOW);

    const events = await service.listEvents('TCK-1084');
    const recent = events.filter((e) => e.createdAt === NOW);
    expect(recent.map((e) => e.type).sort()).toEqual(['assignee', 'status']);
    expect(recent.find((e) => e.type === 'status')?.to).toBe('resolved');
    const notifications = await TestBed.inject(NotificationRepository).listByUser(target);
    expect(notifications.some((n) => n.ticketId === 'TCK-1084' && n.type === 'assigned')).toBe(true);
  });

  it('respects the recipient notification preferences', async () => {
    await TestBed.inject(PreferencesRepository).save({
      ...defaultPreferences('usr_agent_3'),
      notifications: { assigned: false, comment: true, status: true },
    });
    await signIn('agent@supportcenter.dev');
    await service.load();
    const ticket = service.tickets().find((t) => t.assigneeId === null)!;
    const updated = await service.assign(ticket, 'usr_agent_3');
    expect(updated.assigneeId).toBe('usr_agent_3');
    const notifications = await TestBed.inject(NotificationRepository).listByUser('usr_agent_3');
    expect(notifications.some((n) => n.ticketId === ticket.id && n.type === 'assigned')).toBe(false);
  });

  it('forbids agents from deleting and customers from changing priority', async () => {
    await signIn('agent@supportcenter.dev');
    const ticket = (await service.getById('TCK-1001'))!;
    await expect(service.delete(ticket)).rejects.toBeInstanceOf(AppError);

    await signIn('customer@supportcenter.dev');
    await service.load();
    const own = service.tickets()[0];
    await expect(service.changePriority(own, 'critical')).rejects.toThrowError("You don't have permission");
    await expect(service.changeStatus(own, 'in_progress')).rejects.toBeInstanceOf(AppError);
  });

  it('lets a customer close and reopen an own ticket', async () => {
    await signIn('customer@supportcenter.dev');
    await service.load();
    const own = service.tickets().find((t) => t.status !== 'closed')!;
    const closed = await service.changeStatus(own, 'closed');
    expect(closed.status).toBe('closed');
    const reopened = await service.changeStatus(closed, 'open');
    expect(reopened.status).toBe('open');
    expect(reopened.resolvedAt).toBeNull();
  });

  it('hides internal notes from customers', async () => {
    await signIn('agent@supportcenter.dev');
    await service.load();
    const ticket = service.tickets().find((t) => t.customerId === 'usr_cust_1')!;
    await service.addComment(ticket, 'Checked the logs', true);
    await service.addComment(ticket, 'We are on it', false);
    expect((await service.listComments(ticket.id)).some((c) => c.internal)).toBe(true);

    await signIn('customer@supportcenter.dev');
    const visible = await service.listComments(ticket.id);
    expect(visible.some((c) => c.internal)).toBe(false);
    expect(visible.some((c) => c.body === 'We are on it')).toBe(true);
    const events = await service.listEvents(ticket.id);
    expect(events.some((e) => e.to === 'internal')).toBe(false);
  });

  it('deletes a ticket with its comments and history (admin)', async () => {
    await signIn('admin@supportcenter.dev');
    const ticket = (await service.getById('TCK-1050'))!;
    await service.addComment(ticket, 'note', false);
    await service.delete(ticket);
    expect(await service.getById('TCK-1050')).toBeNull();
    expect(await TestBed.inject(CommentRepository).listByTicket('TCK-1050')).toEqual([]);
    expect(await TestBed.inject(TicketEventRepository).listByTicket('TCK-1050')).toEqual([]);
  });
});
