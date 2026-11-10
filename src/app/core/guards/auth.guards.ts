import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { Permission } from '@core/auth/permissions';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';

/** Пускает только авторизованных, иначе — на /login с возвратом */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Страницы входа/регистрации — только для гостей */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};

/** Проверка прав по data.permission дочернего маршрута */
export const permissionGuard: CanActivateChildFn = (route) => {
  const permission = route.data['permission'] as Permission | undefined;
  if (!permission) return true;
  const auth = inject(AuthService);
  if (auth.can(permission)) return true;
  inject(ToastService).error("You don't have access to this page.");
  return inject(Router).createUrlTree(['/dashboard']);
};
