import { inject, Injectable } from '@angular/core';
import { DemoDataControl } from '@core/data/repositories';
import { Clock } from '@core/services/clock';
import { LocalStore } from './local-store';
import { generateDemoData } from './seed-data';
import { STORAGE_KEYS } from './storage-keys';

/** Увеличить, если поменялась структура демо-данных — старые данные пересоздадутся */
const SEED_VERSION = 2;

@Injectable()
export class DemoSeeder implements DemoDataControl {
  private readonly store = inject(LocalStore);
  private readonly clock = inject(Clock);
  readonly supported = true;

  /** Синхронно, чтобы данные были готовы до восстановления сессии */
  ensureSeeded(): void {
    if (this.store.read<number>(STORAGE_KEYS.seedVersion, 0) === SEED_VERSION) return;
    this.store.clearAll([STORAGE_KEYS.theme]);
    this.seed();
  }

  /** Сброс к исходным демо-данным. Сессию и тему сохраняем */
  async reset(): Promise<void> {
    const session = this.store.read<unknown>(STORAGE_KEYS.session, null);
    this.store.clearAll([STORAGE_KEYS.theme]);
    this.seed();
    if (session) this.store.write(STORAGE_KEYS.session, session);
  }

  private seed(): void {
    const data = generateDemoData(this.clock.now());
    this.store.write(STORAGE_KEYS.users, data.users);
    this.store.write(STORAGE_KEYS.credentials, data.credentials);
    this.store.write(STORAGE_KEYS.tickets, data.tickets);
    this.store.write(STORAGE_KEYS.comments, data.comments);
    this.store.write(STORAGE_KEYS.events, data.events);
    this.store.write(STORAGE_KEYS.notifications, data.notifications);
    this.store.write(STORAGE_KEYS.seedVersion, SEED_VERSION);
  }
}
