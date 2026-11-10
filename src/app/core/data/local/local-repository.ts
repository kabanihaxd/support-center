import { inject } from '@angular/core';
import { AppError } from '@core/errors/app-error';
import { Entity, EntityPatch, NewEntity, Repository } from '../repository';
import { DATA_LATENCY, simulateLatency } from './latency';
import { LocalStore } from './local-store';

/** Общая реализация CRUD поверх одного ключа localStorage */
export abstract class LocalRepository<T extends Entity> implements Repository<T> {
  protected abstract readonly key: string;
  protected abstract readonly entityName: string;
  protected readonly store = inject(LocalStore);
  private readonly latency = inject(DATA_LATENCY);

  protected abstract generateId(existing: readonly T[]): string;

  async list(): Promise<T[]> {
    await this.delay();
    return structuredClone(this.readAll());
  }

  async getById(id: string): Promise<T | null> {
    await this.delay();
    const item = this.readAll().find((x) => x.id === id);
    return item ? structuredClone(item) : null;
  }

  async create(data: NewEntity<T>): Promise<T> {
    await this.delay();
    const items = this.readAll();
    const entity = { ...data, id: this.generateId(items) } as T;
    this.writeAll([...items, entity]);
    return structuredClone(entity);
  }

  async update(id: string, patch: EntityPatch<T>): Promise<T> {
    await this.delay();
    const items = this.readAll();
    const index = items.findIndex((x) => x.id === id);
    if (index === -1) throw new AppError('not-found', `${this.entityName} not found.`);
    const updated = { ...items[index], ...patch, id } as T;
    this.writeAll(items.map((x, i) => (i === index ? updated : x)));
    return structuredClone(updated);
  }

  async delete(id: string): Promise<void> {
    await this.delay();
    const items = this.readAll();
    if (!items.some((x) => x.id === id)) throw new AppError('not-found', `${this.entityName} not found.`);
    this.writeAll(items.filter((x) => x.id !== id));
  }

  protected readAll(): T[] {
    return this.store.read<T[]>(this.key, []);
  }

  protected writeAll(items: T[]): void {
    this.store.write(this.key, items);
  }

  protected delay(): Promise<void> {
    return simulateLatency(this.latency);
  }
}
