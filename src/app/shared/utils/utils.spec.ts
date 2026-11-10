import { safeReturnUrl } from '@features/auth/safe-return-url';
import { addHours, formatDuration, hoursBetween } from './dates';
import { nextTicketId } from './id';
import { createRandom } from './random';

describe('nextTicketId', () => {
  it('starts at TCK-1001', () => {
    expect(nextTicketId([])).toBe('TCK-1001');
  });

  it('continues after the highest existing number, even with gaps', () => {
    expect(nextTicketId(['TCK-1001', 'TCK-1007', 'TCK-1003'])).toBe('TCK-1008');
  });
});

describe('dates', () => {
  it('adds hours and measures the difference', () => {
    const start = '2026-01-01T00:00:00.000Z';
    const end = addHours(start, 30);
    expect(end).toBe('2026-01-02T06:00:00.000Z');
    expect(hoursBetween(start, end)).toBe(30);
  });

  it('formats durations compactly', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(0.5)).toBe('30m');
    expect(formatDuration(5.25)).toBe('5.3h');
    expect(formatDuration(24)).toBe('1d');
    expect(formatDuration(50)).toBe('2d 2h');
    expect(formatDuration(71.9)).toBe('3d');
  });
});

describe('createRandom', () => {
  it('is deterministic for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect([a.next(), a.next(), a.int(1, 100)]).toEqual([b.next(), b.next(), b.int(1, 100)]);
  });
});

describe('safeReturnUrl', () => {
  it('allows internal paths', () => {
    expect(safeReturnUrl('/tickets/TCK-1001')).toBe('/tickets/TCK-1001');
  });

  it('rejects external and protocol-relative urls', () => {
    expect(safeReturnUrl('https://evil.example')).toBe('/dashboard');
    expect(safeReturnUrl('//evil.example')).toBe('/dashboard');
    expect(safeReturnUrl(undefined)).toBe('/dashboard');
    expect(safeReturnUrl('/login')).toBe('/dashboard');
  });
});
