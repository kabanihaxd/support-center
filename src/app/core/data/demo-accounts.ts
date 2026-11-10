/**
 * Демо-аккаунты для страницы входа. Те же учётные записи нужно завести
 * в Firebase Auth при переходе на реальный бэкенд.
 */
/** Пароль всех демо-аккаунтов (только для mock-бэкенда, не секрет) */
export const DEMO_PASSWORD = 'Demo@123';

export interface DemoAccount {
  role: 'admin' | 'agent' | 'customer';
  email: string;
  name: string;
  description: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { role: 'admin', email: 'admin@supportcenter.dev', name: 'Olivia Bennett', description: 'Full access: users, reports, settings' },
  { role: 'agent', email: 'agent@supportcenter.dev', name: 'Daniel Carter', description: 'Handles and resolves tickets' },
  { role: 'customer', email: 'customer@supportcenter.dev', name: 'Emma Wilson', description: 'Creates and tracks own tickets' },
];
