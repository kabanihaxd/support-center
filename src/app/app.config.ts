import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideLocalData } from '@core/data/local/provide-local-data';
import { AuthService } from '@core/services/auth.service';
import { GlobalErrorHandler } from '@core/services/global-error-handler';
import { PageTitleStrategy } from '@core/services/page-title.strategy';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Бэкенд данных. Для Firebase: заменить на provideFirebaseData()
    provideLocalData(),
    // Восстанавливаем сессию до первой навигации (после засева демо-данных)
    provideAppInitializer(() => inject(AuthService).restore()),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: TitleStrategy, useClass: PageTitleStrategy },
  ],
};
