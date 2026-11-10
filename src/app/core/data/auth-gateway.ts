import { SignUpData, User, UserRole } from '@shared/models';

export interface NewAccount {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  jobTitle?: string;
  company?: string;
}

/** Контракт аутентификации: mock на localStorage сейчас, Firebase Auth позже */
export abstract class AuthGateway {
  abstract signIn(email: string, password: string): Promise<User>;
  abstract signUp(data: SignUpData): Promise<User>;
  abstract signOut(): Promise<void>;
  abstract currentUser(): Promise<User | null>;
  /** Создание учётной записи администратором (без смены текущей сессии) */
  abstract createAccount(data: NewAccount): Promise<User>;
  abstract changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}
