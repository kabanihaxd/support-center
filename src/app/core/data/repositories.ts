import {
  AppNotification,
  Comment,
  Ticket,
  TicketEvent,
  User,
  UserPreferences,
} from '@shared/models';
import { Repository } from './repository';

/*
 * Абстрактные классы используются как DI-токены.
 * Конкретная реализация подключается в app.config.ts (provideLocalData / provideFirebaseData).
 */

export abstract class TicketRepository extends Repository<Ticket> {
  abstract listByCustomer(customerId: string): Promise<Ticket[]>;
}

export abstract class UserRepository extends Repository<User> {
  abstract findByEmail(email: string): Promise<User | null>;
}

export abstract class CommentRepository extends Repository<Comment> {
  abstract listByTicket(ticketId: string): Promise<Comment[]>;
  abstract deleteByTicket(ticketId: string): Promise<void>;
}

export abstract class TicketEventRepository extends Repository<TicketEvent> {
  abstract listByTicket(ticketId: string): Promise<TicketEvent[]>;
  abstract deleteByTicket(ticketId: string): Promise<void>;
}

export abstract class NotificationRepository extends Repository<AppNotification> {
  abstract listByUser(userId: string): Promise<AppNotification[]>;
  abstract markAllRead(userId: string): Promise<void>;
  abstract deleteByTicket(ticketId: string): Promise<void>;
}

export abstract class PreferencesRepository {
  abstract get(userId: string): Promise<UserPreferences>;
  abstract save(preferences: UserPreferences): Promise<UserPreferences>;
}

/** Сброс демо-данных (есть только у mock-бэкенда, у Firebase — no-op) */
export abstract class DemoDataControl {
  abstract readonly supported: boolean;
  abstract reset(): Promise<void>;
}
