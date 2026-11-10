import { Service } from '@angular/core';
import { AppError } from '@core/errors/app-error';

const PREFIX = 'sc:';

/**
 * Обёртка над localStorage: JSON, префикс ключей, защита от недоступного хранилища
 * (приватный режим, запрет cookies) — тогда данные живут в памяти до перезагрузки.
 */
@Service()
export class LocalStore {
  private readonly memory = new Map<string, string>();
  private readonly storage = resolveStorage();

  read<T>(key: string, fallback: T): T {
    const raw = this.getRaw(PREFIX + key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T): void {
    const raw = JSON.stringify(value);
    if (!this.storage) {
      this.memory.set(PREFIX + key, raw);
      return;
    }
    try {
      this.storage.setItem(PREFIX + key, raw);
    } catch {
      throw new AppError('storage', 'Browser storage is full or unavailable. Your changes were not saved.');
    }
  }

  remove(key: string): void {
    this.memory.delete(PREFIX + key);
    try {
      this.storage?.removeItem(PREFIX + key);
    } catch {
      // хранилище недоступно — удалять нечего
    }
  }

  /** Удаляет все ключи приложения, кроме перечисленных */
  clearAll(keep: readonly string[] = []): void {
    const keepFull = new Set(keep.map((k) => PREFIX + k));
    for (const key of [...this.memory.keys()]) {
      if (!keepFull.has(key)) this.memory.delete(key);
    }
    if (!this.storage) return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(PREFIX) && !keepFull.has(key)) keys.push(key);
      }
      keys.forEach((key) => this.storage?.removeItem(key));
    } catch {
      // ignore
    }
  }

  private getRaw(fullKey: string): string | null {
    if (!this.storage) return this.memory.get(fullKey) ?? null;
    try {
      return this.storage.getItem(fullKey);
    } catch {
      return null;
    }
  }
}

function resolveStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    const probe = `${PREFIX}probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
