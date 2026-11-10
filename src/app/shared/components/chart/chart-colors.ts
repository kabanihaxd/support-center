import { TicketStatus } from '@shared/models';
import { ChartColor } from './chart';

/** Цвет статуса на графиках — фиксированный, чтобы статус всегда был одного цвета */
export const STATUS_CHART_COLORS: Record<TicketStatus, ChartColor> = {
  open: 'chart-1',
  in_progress: 'chart-2',
  pending: 'chart-3',
  resolved: 'chart-4',
  closed: 'chart-5',
};
