import { NotificationType } from './notification.model';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserPreferences {
  /** id = userId */
  id: string;
  notifications: Record<NotificationType, boolean>;
  compactTables: boolean;
}
