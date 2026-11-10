import { Permission } from '@core/auth/permissions';
import { IconName } from '@shared/components/icon/icons';

export interface NavItem {
  label: string;
  /** Подпись для клиента (у него «свои» разделы) */
  customerLabel?: string;
  icon: IconName;
  path: string;
  permission?: Permission;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', customerLabel: 'My Dashboard', icon: 'dashboard', path: '/dashboard' },
  { label: 'Tickets', customerLabel: 'My Tickets', icon: 'ticket', path: '/tickets' },
  { label: 'Customers', icon: 'users', path: '/customers', permission: 'customer.view' },
  { label: 'Agents', icon: 'headset', path: '/agents', permission: 'agent.view' },
  { label: 'Reports', icon: 'chart', path: '/reports', permission: 'reports.view' },
  { label: 'Settings', icon: 'settings', path: '/settings' },
];
