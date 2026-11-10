export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  pending: number;
  resolved: number;
  closed: number;
  critical: number;
  overdue: number;
  /** Среднее время решения в часах; null, если решённых тикетов нет */
  avgResolutionHours: number | null;
}
