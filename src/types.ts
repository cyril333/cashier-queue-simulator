export type CustomerType = 'priority' | 'normal';

export interface Customer {
  id: number;
  serviceTime: number;
  type: CustomerType;
}

export type CashierType = 'priority' | 'regular';

export interface CashierState {
  id: string;
  name: string;
  type: CashierType;
  currentCustomer: Customer | null;
  remainingTime: number;
  queue: Customer[];
}
