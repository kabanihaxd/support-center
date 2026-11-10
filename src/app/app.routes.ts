import { Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard } from '@core/guards/auth.guards';
import { Shell } from '@layout/shell/shell';

/** Временная заглушка для разделов следующих этапов */
const placeholder = () => import('@features/placeholder/placeholder.page').then((m) => m.PlaceholderPage);

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [guestGuard],
    loadComponent: () => import('@features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Create account',
    canActivate: [guestGuard],
    loadComponent: () => import('@features/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    canActivateChild: [permissionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: 'Dashboard', loadComponent: placeholder },
      { path: 'tickets', title: 'Tickets', loadComponent: placeholder },
      { path: 'tickets/:id', title: 'Ticket', loadComponent: placeholder },
      { path: 'customers', title: 'Customers', data: { permission: 'customer.view' }, loadComponent: placeholder },
      { path: 'agents', title: 'Agents', data: { permission: 'agent.view' }, loadComponent: placeholder },
      { path: 'reports', title: 'Reports', data: { permission: 'reports.view' }, loadComponent: placeholder },
      { path: 'settings', title: 'Settings', loadComponent: placeholder },
      {
        path: '**',
        title: 'Page not found',
        loadComponent: () => import('@features/not-found/not-found.page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
