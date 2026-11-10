import { Service } from '@angular/core';

/** Источник текущего времени. В тестах подменяется фиксированной датой */
@Service()
export class Clock {
  now(): Date {
    return new Date();
  }

  nowIso(): string {
    return this.now().toISOString();
  }
}
