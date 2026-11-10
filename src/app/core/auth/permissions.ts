import { Ticket, User, UserRole } from '@shared/models';

export type Permission =
  | 'ticket.viewAll'
  | 'ticket.create'
  | 'ticket.edit'
  | 'ticket.delete'
  | 'ticket.assign'
  | 'ticket.changeStatus'
  | 'ticket.changePriority'
  | 'comment.internal'
  | 'customer.view'
  | 'customer.manage'
  | 'agent.view'
  | 'agent.manage'
  | 'reports.view';

/** Единственное место, где описано, что может каждая роль */
const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    'ticket.viewAll',
    'ticket.create',
    'ticket.edit',
    'ticket.delete',
    'ticket.assign',
    'ticket.changeStatus',
    'ticket.changePriority',
    'comment.internal',
    'customer.view',
    'customer.manage',
    'agent.view',
    'agent.manage',
    'reports.view',
  ]),
  agent: new Set<Permission>([
    'ticket.viewAll',
    'ticket.create',
    'ticket.edit',
    'ticket.assign',
    'ticket.changeStatus',
    'ticket.changePriority',
    'comment.internal',
    'customer.view',
  ]),
  customer: new Set<Permission>(['ticket.create']),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

/** Клиент видит только свои тикеты, сотрудники — все */
export function canViewTicket(user: User, ticket: Ticket): boolean {
  return hasPermission(user.role, 'ticket.viewAll') || ticket.customerId === user.id;
}

/** Редактировать заголовок/описание: сотрудники — любой, клиент — свой, пока его не взяли в работу */
export function canEditTicket(user: User, ticket: Ticket): boolean {
  if (hasPermission(user.role, 'ticket.edit')) return true;
  return ticket.customerId === user.id && ticket.status === 'open';
}

/** Клиент может закрыть или переоткрыть свой тикет */
export function canCloseOrReopen(user: User, ticket: Ticket): boolean {
  return hasPermission(user.role, 'ticket.changeStatus') || ticket.customerId === user.id;
}
