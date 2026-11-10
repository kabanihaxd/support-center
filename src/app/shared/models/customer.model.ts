import { User } from './user.model';

export interface Customer extends User {
  role: 'customer';
}

/** Клиент вместе со статистикой обращений (для списка Customers) */
export interface CustomerSummary {
  customer: Customer;
  ticketCount: number;
  openTicketCount: number;
  lastTicketAt: string | null;
}
