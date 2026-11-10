import { CanDeactivateFn, Routes } from '@angular/router';
import type { TicketFormPage } from './form/ticket-form.page';

/** Предупреждение о несохранённых изменениях в форме */
const unsavedChangesGuard: CanDeactivateFn<TicketFormPage> = (page) => page.canLeave();

const formPage = () => import('./form/ticket-form.page').then((m) => m.TicketFormPage);

export const TICKET_ROUTES: Routes = [
  {
    path: '',
    title: 'Tickets',
    loadComponent: () => import('./list/tickets-list.page').then((m) => m.TicketsListPage),
  },
  {
    path: 'new',
    title: 'New ticket',
    data: { permission: 'ticket.create' },
    canDeactivate: [unsavedChangesGuard],
    loadComponent: formPage,
  },
  {
    path: ':id',
    title: 'Ticket',
    loadComponent: () => import('./details/ticket-details.page').then((m) => m.TicketDetailsPage),
  },
  {
    path: ':id/edit',
    title: 'Edit ticket',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: formPage,
  },
];
