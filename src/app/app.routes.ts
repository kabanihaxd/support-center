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
      { path: 'tickets', loadChildren: () => import('@features/tickets/tickets.routes').then((m) => m.TICKET_ROUTES) },
      {
        path: 'customers',
        data: { permission: 'customer.view' },
        children: [
          {
            path: '',
            title: 'Customers',
            loadComponent: () =>
              import('@features/customers/list/customers-list.page').then((m) => m.CustomersListPage),
          },
          {
            path: ':id',
            title: 'Customer',
            loadComponent: () =>
              import('@features/customers/profile/customer-profile.page').then((m) => m.CustomerProfilePage),
          },
        ],
      },
      {
        path: 'agents',
        data: { permission: 'agent.view' },
        children: [
          {
            path: '',
            title: 'Agents',
            loadComponent: () => import('@features/agents/list/agents-list.page').then((m) => m.AgentsListPage),
          },
          {
            path: ':id',
            title: 'Agent',
            loadComponent: () => import('@features/agents/profile/agent-profile.page').then((m) => m.AgentProfilePage),
          },
        ],
      },
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
