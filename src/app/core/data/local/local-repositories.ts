import { Injectable } from '@angular/core';
import {
  CommentRepository,
  NotificationRepository,
  PreferencesRepository,
  TicketEventRepository,
  TicketRepository,
  UserRepository,
} from '@core/data/repositories';
import { AppNotification, Comment, Ticket, TicketEvent, User, UserPreferences } from '@shared/models';
import { defaultPreferences } from '@shared/models/preferences.defaults';
import { createId, nextTicketId } from '@shared/utils/id';
import { LocalRepository } from './local-repository';
import { STORAGE_KEYS } from './storage-keys';

@Injectable()
export class LocalTicketRepository extends LocalRepository<Ticket> implements TicketRepository {
  protected readonly key = STORAGE_KEYS.tickets;
  protected readonly entityName = 'Ticket';
  protected generateId(existing: readonly Ticket[]): string {
    return nextTicketId(existing.map((t) => t.id));
  }
}

@Injectable()
export class LocalUserRepository extends LocalRepository<User> implements UserRepository {
  protected readonly key = STORAGE_KEYS.users;
  protected readonly entityName = 'User';
  protected generateId(): string {
    return createId('usr');
  }

  async findByEmail(email: string): Promise<User | null> {
    await this.delay();
    const normalized = email.trim().toLowerCase();
    const user = this.readAll().find((u) => u.email.toLowerCase() === normalized);
    return user ? structuredClone(user) : null;
  }
}

@Injectable()
export class LocalCommentRepository extends LocalRepository<Comment> implements CommentRepository {
  protected readonly key = STORAGE_KEYS.comments;
  protected readonly entityName = 'Comment';
  protected generateId(): string {
    return createId('cmt');
  }

  async listByTicket(ticketId: string): Promise<Comment[]> {
    await this.delay();
    return structuredClone(this.readAll().filter((c) => c.ticketId === ticketId));
  }

  async deleteByTicket(ticketId: string): Promise<void> {
    this.writeAll(this.readAll().filter((c) => c.ticketId !== ticketId));
  }
}

@Injectable()
export class LocalTicketEventRepository extends LocalRepository<TicketEvent> implements TicketEventRepository {
  protected readonly key = STORAGE_KEYS.events;
  protected readonly entityName = 'Ticket event';
  protected generateId(): string {
    return createId('evt');
  }

  async listByTicket(ticketId: string): Promise<TicketEvent[]> {
    await this.delay();
    return structuredClone(this.readAll().filter((e) => e.ticketId === ticketId));
  }

  async deleteByTicket(ticketId: string): Promise<void> {
    this.writeAll(this.readAll().filter((e) => e.ticketId !== ticketId));
  }
}

@Injectable()
export class LocalNotificationRepository
  extends LocalRepository<AppNotification>
  implements NotificationRepository
{
  protected readonly key = STORAGE_KEYS.notifications;
  protected readonly entityName = 'Notification';
  protected generateId(): string {
    return createId('ntf');
  }

  async listByUser(userId: string): Promise<AppNotification[]> {
    await this.delay();
    return structuredClone(this.readAll().filter((n) => n.userId === userId));
  }

  async markAllRead(userId: string): Promise<void> {
    await this.delay();
    this.writeAll(this.readAll().map((n) => (n.userId === userId ? { ...n, read: true } : n)));
  }
}

@Injectable()
export class LocalPreferencesRepository implements PreferencesRepository {
  private readonly items = new LocalPreferencesStore();

  get(userId: string): Promise<UserPreferences> {
    return this.items.get(userId);
  }

  save(preferences: UserPreferences): Promise<UserPreferences> {
    return this.items.save(preferences);
  }
}

/** Настройки хранятся как коллекция с id = userId */
class LocalPreferencesStore extends LocalRepository<UserPreferences> {
  protected readonly key = STORAGE_KEYS.preferences;
  protected readonly entityName = 'Preferences';
  protected generateId(): string {
    return createId('prf');
  }

  async get(userId: string): Promise<UserPreferences> {
    await this.delay();
    const found = this.readAll().find((p) => p.id === userId);
    return found ? structuredClone(found) : defaultPreferences(userId);
  }

  async save(preferences: UserPreferences): Promise<UserPreferences> {
    await this.delay();
    const others = this.readAll().filter((p) => p.id !== preferences.id);
    this.writeAll([...others, preferences]);
    return structuredClone(preferences);
  }
}
