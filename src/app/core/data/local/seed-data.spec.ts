import { ACTIVE_STATUSES } from '@shared/models';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../demo-accounts';
import { verifyCredential } from './password-hash';
import { generateDemoData } from './seed-data';

describe('generateDemoData', () => {
  const now = new Date('2026-11-10T12:00:00.000Z');
  const data = generateDemoData(now);
  const userIds = new Set(data.users.map((u) => u.id));
  const ticketIds = new Set(data.tickets.map((t) => t.id));

  it('is deterministic', () => {
    expect(generateDemoData(now)).toEqual(data);
  });

  it('creates unique sequential ticket ids', () => {
    expect(ticketIds.size).toBe(data.tickets.length);
    expect(data.tickets[0].id).toBe('TCK-1001');
  });

  it('references only existing users and tickets', () => {
    for (const t of data.tickets) {
      expect(userIds.has(t.customerId)).toBe(true);
      if (t.assigneeId) expect(userIds.has(t.assigneeId)).toBe(true);
    }
    for (const c of data.comments) expect(ticketIds.has(c.ticketId)).toBe(true);
    for (const e of data.events) expect(ticketIds.has(e.ticketId)).toBe(true);
    for (const n of data.notifications) expect(ticketIds.has(n.ticketId)).toBe(true);
  });

  it('keeps dates consistent', () => {
    for (const t of data.tickets) {
      expect(t.createdAt <= now.toISOString()).toBe(true);
      if (t.resolvedAt) {
        expect(t.resolvedAt >= t.createdAt).toBe(true);
        expect(ACTIVE_STATUSES).not.toContain(t.status);
      } else {
        expect(['resolved', 'closed']).not.toContain(t.status);
      }
    }
  });

  it('contains every status and the demo accounts', () => {
    const statuses = new Set(data.tickets.map((t) => t.status));
    expect([...statuses].sort()).toEqual(['closed', 'in_progress', 'open', 'pending', 'resolved']);
    for (const account of DEMO_ACCOUNTS) {
      const user = data.users.find((u) => u.email === account.email);
      expect(user?.role).toBe(account.role);
      const credential = data.credentials.find((c) => c.userId === user?.id);
      expect(credential && verifyCredential(credential, DEMO_PASSWORD)).toBe(true);
    }
  });

  it('gives the demo customer some tickets', () => {
    expect(data.tickets.filter((t) => t.customerId === 'usr_cust_1').length).toBeGreaterThan(3);
  });
});
