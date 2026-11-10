/** Уникальный id для внутренних сущностей (комментарии, события, уведомления) */
export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  return `${prefix}_${random}`;
}

export const TICKET_ID_PREFIX = 'TCK-';
export const FIRST_TICKET_NUMBER = 1001;

/** Следующий человекочитаемый номер тикета: TCK-1001, TCK-1002, ... */
export function nextTicketId(existingIds: readonly string[]): string {
  const max = existingIds.reduce((acc, id) => {
    const n = Number(id.replace(TICKET_ID_PREFIX, ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, FIRST_TICKET_NUMBER - 1);
  return `${TICKET_ID_PREFIX}${max + 1}`;
}
