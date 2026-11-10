export interface Entity {
  readonly id: string;
}

export type NewEntity<T extends Entity> = Omit<T, 'id'>;
export type EntityPatch<T extends Entity> = Partial<Omit<T, 'id'>>;

/**
 * Базовый контракт хранилища коллекции. Сейчас реализован поверх localStorage,
 * позже — поверх Firestore, без изменений в сервисах и компонентах.
 */
export abstract class Repository<T extends Entity> {
  abstract list(): Promise<T[]>;
  abstract getById(id: string): Promise<T | null>;
  abstract create(data: NewEntity<T>): Promise<T>;
  abstract update(id: string, patch: EntityPatch<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
}
