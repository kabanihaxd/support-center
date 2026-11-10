export const NOTIFICATION_TYPES = ['assigned', 'comment', 'status'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  ticketId: string;
  message: string;
  createdAt: string;
  read: boolean;
}
