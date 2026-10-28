import { Customer, CashierState } from '../types';

export const INITIAL_CASHIERS_FACTORY = (): CashierState[] => [
  {
    id: 'cashier-1',
    name: 'Priority Cashier',
    type: 'priority',
    currentCustomer: null,
    remainingTime: 0,
    queue: [],
  },
  {
    id: 'cashier-2',
    name: 'Regular Cashier',
    type: 'regular',
    currentCustomer: null,
    remainingTime: 0,
    queue: [],
  },
  {
    id: 'cashier-3',
    name: 'Regular Cashier',
    type: 'regular',
    currentCustomer: null,
    remainingTime: 0,
    queue: [],
  },
];

export function assignSingleCustomer(
  customer: Customer,
  currentCashiers: CashierState[]
): CashierState[] {
  const updated = currentCashiers.map((c) => ({
    ...c,
    queue: [...c.queue],
  }));

  const priorityCashierIndices = updated
    .map((c, i) => (c.type === 'priority' ? i : -1))
    .filter((i) => i !== -1);
  const regularCashierIndices = updated
    .map((c, i) => (c.type === 'regular' ? i : -1))
    .filter((i) => i !== -1);

  if (customer.type === 'priority') {
    const targetPool =
      priorityCashierIndices.length > 0
        ? priorityCashierIndices
        : regularCashierIndices;

    if (targetPool.length === 0) return updated;

    let bestIndex = targetPool[0];
    let minLoad =
      updated[bestIndex].queue.length +
      (updated[bestIndex].currentCustomer ? 1 : 0);

    for (let i = 1; i < targetPool.length; i++) {
      const idx = targetPool[i];
      const load =
        updated[idx].queue.length + (updated[idx].currentCustomer ? 1 : 0);
      if (load < minLoad) {
        minLoad = load;
        bestIndex = idx;
      }
    }

    const targetCashier = updated[bestIndex];
    if (!targetCashier.currentCustomer) {
      targetCashier.currentCustomer = customer;
      targetCashier.remainingTime = customer.serviceTime;
    } else {
      targetCashier.queue.push(customer);
    }
  } else {
    const emptyPriorityIndex = priorityCashierIndices.find(
      (idx) => !updated[idx].currentCustomer && updated[idx].queue.length === 0
    );

    if (emptyPriorityIndex !== undefined) {
      const priorityCashier = updated[emptyPriorityIndex];
      priorityCashier.currentCustomer = customer;
      priorityCashier.remainingTime = customer.serviceTime;
    } else {
      const targetPool =
        regularCashierIndices.length > 0
          ? regularCashierIndices
          : priorityCashierIndices;

      if (targetPool.length === 0) return updated;

      let shortestIndex = targetPool[0];
      let minLoad =
        updated[shortestIndex].queue.length +
        (updated[shortestIndex].currentCustomer ? 1 : 0);

      for (let i = 1; i < targetPool.length; i++) {
        const idx = targetPool[i];
        const load =
          updated[idx].queue.length + (updated[idx].currentCustomer ? 1 : 0);
        if (load < minLoad) {
          minLoad = load;
          shortestIndex = idx;
        }
      }

      const targetCashier = updated[shortestIndex];
      if (!targetCashier.currentCustomer) {
        targetCashier.currentCustomer = customer;
        targetCashier.remainingTime = customer.serviceTime;
      } else {
        targetCashier.queue.push(customer);
      }
    }
  }

  return updated;
}

export function tickCashiers(cashiers: CashierState[]): {
  cashiers: CashierState[];
  completedCustomers: Customer[];
} {
  const completedCustomers: Customer[] = [];

  const updatedCashiers = cashiers.map((cashier) => {
    if (!cashier.currentCustomer) {
      return cashier;
    }

    const nextRemaining = cashier.remainingTime - 1;
    if (nextRemaining <= 0) {
      completedCustomers.push(cashier.currentCustomer);

      if (cashier.queue.length > 0) {
        const [nextCustomer, ...remainingQueue] = cashier.queue;
        return {
          ...cashier,
          currentCustomer: nextCustomer,
          remainingTime: nextCustomer.serviceTime,
          queue: remainingQueue,
        };
      } else {
        return {
          ...cashier,
          currentCustomer: null,
          remainingTime: 0,
          queue: [],
        };
      }
    }

    return {
      ...cashier,
      remainingTime: nextRemaining,
    };
  });

  return { cashiers: updatedCashiers, completedCustomers };
}
