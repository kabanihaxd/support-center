export const USER_ROLES = ['admin', 'agent', 'customer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  agent: 'Agent',
  customer: 'Customer',
};

/** Базовая учётная запись. Customer и Agent — это User с конкретной ролью */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** ISO-дата регистрации */
  createdAt: string;
  active: boolean;
  /** Должность сотрудника поддержки (Agent/Admin) */
  jobTitle?: string;
  /** Компания клиента (Customer) */
  company?: string;
  phone?: string;
}

/** Данные для саморегистрации клиента */
export interface SignUpData {
  name: string;
  email: string;
  password: string;
  company?: string;
}
