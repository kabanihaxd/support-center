import { IconName } from '@shared/components/icon/icons';
import { PRIORITY_LABELS, STATUS_LABELS, TicketEvent, TicketPriority, TicketStatus } from '@shared/models';

const status = (s: string | null) => (s ? (STATUS_LABELS[s as TicketStatus] ?? s) : '—');
const priority = (p: string | null) => (p ? (PRIORITY_LABELS[p as TicketPriority] ?? p) : '—');

/** Текст записи истории: «changed status from Open to In Progress» */
export function describeEvent(event: TicketEvent, nameOf: (id: string | null) => string): string {
  switch (event.type) {
    case 'created':
      return 'created the ticket';
    case 'status':
      return `changed status from ${status(event.from)} to ${status(event.to)}`;
    case 'priority':
      return `changed priority from ${priority(event.from)} to ${priority(event.to)}`;
    case 'assignee':
      if (!event.to) return `unassigned ${nameOf(event.from)}`;
      return event.from ? `reassigned from ${nameOf(event.from)} to ${nameOf(event.to)}` : `assigned the ticket to ${nameOf(event.to)}`;
    case 'edited':
      return 'edited the ticket details';
    case 'comment':
      return event.to === 'internal' ? 'added an internal note' : 'added a comment';
  }
}

export const EVENT_ICONS: Record<TicketEvent['type'], IconName> = {
  created: 'plus',
  status: 'activity',
  priority: 'flag',
  assignee: 'user-plus',
  edited: 'pencil',
  comment: 'message',
};
