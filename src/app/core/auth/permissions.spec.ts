import { Ticket, User } from '@shared/models';
import { canCloseOrReopen, canEditTicket, canViewTicket, hasPermission } from './permissions';

const user = (role: User['role'], id = 'u1'): User => ({
  id,
  name: 'Test',
  email: `${id}@test.dev`,
  role,
  createdAt: '2026-01-01T00:00:00.000Z',
  active: true,
});

const ticket = (patch: Partial<Ticket> = {}): Ticket => ({
  id: 'TCK-1001',
  title: 'Printer',
  description: 'Broken',
  category: 'hardware',
  priority: 'medium',
  status: 'open',
  customerId: 'cust',
  assigneeId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  resolvedAt: null,
  dueAt: '2026-01-04T00:00:00.000Z',
  ...patch,
});

describe('permissions', () => {
  it('gives admin full access', () => {
    expect(hasPermission('admin', 'ticket.delete')).toBe(true);
    expect(hasPermission('admin', 'agent.manage')).toBe(true);
    expect(hasPermission('admin', 'reports.view')).toBe(true);
  });

  it('lets agents work tickets but not delete them or see admin sections', () => {
    expect(hasPermission('agent', 'ticket.changeStatus')).toBe(true);
    expect(hasPermission('agent', 'ticket.assign')).toBe(true);
    expect(hasPermission('agent', 'customer.view')).toBe(true);
    expect(hasPermission('agent', 'ticket.delete')).toBe(false);
    expect(hasPermission('agent', 'agent.view')).toBe(false);
    expect(hasPermission('agent', 'reports.view')).toBe(false);
  });

  it('restricts customers to creating tickets', () => {
    expect(hasPermission('customer', 'ticket.create')).toBe(true);
    expect(hasPermission('customer', 'ticket.viewAll')).toBe(false);
    expect(hasPermission('customer', 'comment.internal')).toBe(false);
  });

  it('shows customers only their own tickets', () => {
    expect(canViewTicket(user('customer', 'cust'), ticket())).toBe(true);
    expect(canViewTicket(user('customer', 'other'), ticket())).toBe(false);
    expect(canViewTicket(user('agent'), ticket())).toBe(true);
  });

  it('lets a customer edit an own ticket only while it is open', () => {
    const owner = user('customer', 'cust');
    expect(canEditTicket(owner, ticket())).toBe(true);
    expect(canEditTicket(owner, ticket({ status: 'in_progress' }))).toBe(false);
    expect(canEditTicket(user('agent'), ticket({ status: 'in_progress' }))).toBe(true);
  });

  it('lets a customer close or reopen only own tickets', () => {
    expect(canCloseOrReopen(user('customer', 'cust'), ticket())).toBe(true);
    expect(canCloseOrReopen(user('customer', 'other'), ticket())).toBe(false);
  });
});
