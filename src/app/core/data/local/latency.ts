import { InjectionToken } from '@angular/core';

export interface Latency {
  min: number;
  max: number;
}

/** Имитация сетевой задержки mock-бэкенда (в тестах — 0) */
export const DATA_LATENCY = new InjectionToken<Latency>('DATA_LATENCY', {
  factory: () => ({ min: 250, max: 600 }),
});

export function simulateLatency({ min, max }: Latency): Promise<void> {
  if (max <= 0) return Promise.resolve();
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
