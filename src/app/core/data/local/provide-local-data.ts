import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { AuthGateway } from '@core/data/auth-gateway';
import {
  CommentRepository,
  DemoDataControl,
  NotificationRepository,
  PreferencesRepository,
  TicketEventRepository,
  TicketRepository,
  UserRepository,
} from '@core/data/repositories';
import { DemoSeeder } from './demo-seeder';
import { LocalAuthGateway } from './local-auth.gateway';
import {
  LocalCommentRepository,
  LocalNotificationRepository,
  LocalPreferencesRepository,
  LocalTicketEventRepository,
  LocalTicketRepository,
  LocalUserRepository,
} from './local-repositories';

/**
 * Mock-бэкенд на localStorage. Чтобы перейти на Firebase, достаточно заменить
 * provideLocalData() на provideFirebaseData() в app.config.ts.
 */
export function provideLocalData(): EnvironmentProviders {
  return makeEnvironmentProviders([
    DemoSeeder,
    { provide: DemoDataControl, useExisting: DemoSeeder },
    { provide: TicketRepository, useClass: LocalTicketRepository },
    { provide: UserRepository, useClass: LocalUserRepository },
    { provide: CommentRepository, useClass: LocalCommentRepository },
    { provide: TicketEventRepository, useClass: LocalTicketEventRepository },
    { provide: NotificationRepository, useClass: LocalNotificationRepository },
    { provide: PreferencesRepository, useClass: LocalPreferencesRepository },
    { provide: AuthGateway, useClass: LocalAuthGateway },
    provideAppInitializer(() => inject(DemoSeeder).ensureSeeded()),
  ]);
}
