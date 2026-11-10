import { UserPreferences } from './preferences.model';

export function defaultPreferences(userId: string): UserPreferences {
  return {
    id: userId,
    notifications: { assigned: true, comment: true, status: true },
    compactTables: false,
  };
}
