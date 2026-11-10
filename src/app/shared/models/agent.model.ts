import { User } from './user.model';

/** IT-специалист. Admin тоже может брать тикеты, поэтому роль — agent или admin */
export interface Agent extends User {
  role: 'agent' | 'admin';
}

/** Нагрузка и производительность специалиста */
export interface AgentWorkload {
  agent: Agent;
  assignedCount: number;
  activeCount: number;
  resolvedCount: number;
  overdueCount: number;
  avgResolutionHours: number | null;
}
