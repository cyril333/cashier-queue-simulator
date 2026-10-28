import assert from 'node:assert';

// Emulate the logic
function createInitialCashiers() {
  return [
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
}

function assignSingleCustomer(customer, currentCashiers) {
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

function tickCashiers(cashiers) {
  const completedCustomers = [];

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

console.log('--- RUNNING QUEUE SIMULATOR TESTS ---');

// Test 1: Priority customer assigns to Priority Cashier when idle
{
  let cashiers = createInitialCashiers();
  const c0 = { id: 0, serviceTime: 50, type: 'priority' };
  cashiers = assignSingleCustomer(c0, cashiers);

  assert.strictEqual(cashiers[0].currentCustomer.id, 0);
  assert.strictEqual(cashiers[0].remainingTime, 50);
  assert.strictEqual(cashiers[0].queue.length, 0);
  console.log('✓ Test 1 Passed: Priority customer assigned to empty Priority Cashier');
}

// Test 2: Second priority customer queues behind first priority customer
{
  let cashiers = createInitialCashiers();
  const c0 = { id: 0, serviceTime: 50, type: 'priority' };
  const c1 = { id: 1, serviceTime: 30, type: 'priority' };
  cashiers = assignSingleCustomer(c0, cashiers);
  cashiers = assignSingleCustomer(c1, cashiers);

  assert.strictEqual(cashiers[0].currentCustomer.id, 0);
  assert.strictEqual(cashiers[0].queue.length, 1);
  assert.strictEqual(cashiers[0].queue[0].id, 1);
  console.log('✓ Test 2 Passed: Priority customer queues behind active Priority customer');
}

// Test 3: Normal customer assigned to Priority Cashier when Priority Cashier is empty!
// Requirement: "If priority cashier is empty, normal customer can be served"
{
  let cashiers = createInitialCashiers();
  const cNormal = { id: 0, serviceTime: 25, type: 'normal' };
  cashiers = assignSingleCustomer(cNormal, cashiers);

  assert.strictEqual(cashiers[0].currentCustomer.id, 0, 'Should be served at Priority Cashier');
  assert.strictEqual(cashiers[0].remainingTime, 25);
  console.log('✓ Test 3 Passed: Normal customer served at empty Priority Cashier');
}

// Test 4: Normal customer assigned to Regular Cashiers when Priority Cashier is BUSY!
// Requirement: "Customers will always queue to the shortest queue for their customer type"
{
  let cashiers = createInitialCashiers();
  const cPriority = { id: 0, serviceTime: 50, type: 'priority' };
  cashiers = assignSingleCustomer(cPriority, cashiers); // Priority cashier is now busy

  const cNormal1 = { id: 1, serviceTime: 40, type: 'normal' };
  cashiers = assignSingleCustomer(cNormal1, cashiers);
  // Should go to Regular Cashier 1 (index 1)
  assert.strictEqual(cashiers[1].currentCustomer.id, 1);

  const cNormal2 = { id: 2, serviceTime: 35, type: 'normal' };
  cashiers = assignSingleCustomer(cNormal2, cashiers);
  // Should go to Regular Cashier 2 (index 2) because RC1 is busy with 1 load, RC2 has 0 load!
  assert.strictEqual(cashiers[2].currentCustomer.id, 2);

  const cNormal3 = { id: 3, serviceTime: 20, type: 'normal' };
  cashiers = assignSingleCustomer(cNormal3, cashiers);
  // Both RC1 and RC2 have 1 load (current customer). Shortest queue tie breaker goes to RC1!
  assert.strictEqual(cashiers[1].queue.length, 1);
  assert.strictEqual(cashiers[1].queue[0].id, 3);

  const cNormal4 = { id: 4, serviceTime: 15, type: 'normal' };
  cashiers = assignSingleCustomer(cNormal4, cashiers);
  // RC1 has load 2 (serving + 1 queue), RC2 has load 1 (serving + 0 queue). Goes to RC2!
  assert.strictEqual(cashiers[2].queue.length, 1);
  assert.strictEqual(cashiers[2].queue[0].id, 4);

  console.log('✓ Test 4 Passed: Shortest queue load balancing among regular cashiers');
}

// Test 5: Verify exact Page 2 sequence
// Page 2:
// Cashier 1: Serving Customer 0 (6s remaining), Queue: Customer 2 (12s), Customer 4 (15s)
// Cashier 2: Serving Customer 1 (57s remaining), Queue: Customer 5 (57s)
// Cashier 3: Serving Customer 3 (55s remaining), Queue: Customer 6 (104s)
// Now Customer 7 arrives -> goes to Cashier 2 (queue has #5 and #7)
// After 6 seconds, Customer 0 finishes -> Customer 2 is now serving!
{
  let cashiers = [
    {
      id: 'cashier-1',
      name: 'Priority Cashier',
      type: 'priority',
      currentCustomer: { id: 0, serviceTime: 50, type: 'priority' },
      remainingTime: 6,
      queue: [
        { id: 2, serviceTime: 12, type: 'priority' },
        { id: 4, serviceTime: 15, type: 'priority' },
      ],
    },
    {
      id: 'cashier-2',
      name: 'Regular Cashier',
      type: 'regular',
      currentCustomer: { id: 1, serviceTime: 60, type: 'normal' },
      remainingTime: 57,
      queue: [{ id: 5, serviceTime: 57, type: 'normal' }],
    },
    {
      id: 'cashier-3',
      name: 'Regular Cashier',
      type: 'regular',
      currentCustomer: { id: 3, serviceTime: 60, type: 'normal' },
      remainingTime: 55,
      queue: [{ id: 6, serviceTime: 104, type: 'normal' }],
    },
  ];

  // Assign Customer 7 (normal or priority customer queued to regular)
  const c7 = { id: 7, serviceTime: 38, type: 'normal' };
  cashiers = assignSingleCustomer(c7, cashiers);

  // Both Cashier 2 and 3 have 1 in queue. Customer 7 must go to Cashier 2 queue (position 2)!
  assert.strictEqual(cashiers[1].queue.length, 2);
  assert.strictEqual(cashiers[1].queue[1].id, 7);
  console.log('✓ Test 5A Passed: Customer 7 added to Regular Cashier 1 queue (matches Diagram 2 label C)');

  // Tick 6 seconds
  for (let s = 0; s < 6; s++) {
    const res = tickCashiers(cashiers);
    cashiers = res.cashiers;
  }

  // Priority cashier should now be serving Customer 2 with 12s remaining, and queue has Customer 4!
  assert.strictEqual(cashiers[0].currentCustomer.id, 2);
  assert.strictEqual(cashiers[0].remainingTime, 12);
  assert.strictEqual(cashiers[0].queue.length, 1);
  assert.strictEqual(cashiers[0].queue[0].id, 4);

  // Cashier 2 should have 57 - 6 = 51s remaining
  assert.strictEqual(cashiers[1].remainingTime, 51);

  // Cashier 3 should have 55 - 6 = 49s remaining
  assert.strictEqual(cashiers[2].remainingTime, 49);

  console.log('✓ Test 5B Passed: 6 second tick matches Page 2 Diagram 2 exactly!');
}

// Test 6: Dynamic addition of a second Priority Cashier
{
  let cashiers = createInitialCashiers();
  // Fill first priority cashier
  cashiers[0].currentCustomer = { id: 1, serviceTime: 30, type: 'priority' };
  cashiers[0].remainingTime = 30;

  // Add new Priority Cashier
  cashiers.push({
    id: 'cashier-4',
    name: 'Priority Cashier 2',
    type: 'priority',
    currentCustomer: null,
    remainingTime: 0,
    queue: [],
  });

  // Assign a new priority customer
  const newPriorityCustomer = { id: 2, serviceTime: 25, type: 'priority' };
  cashiers = assignSingleCustomer(newPriorityCustomer, cashiers);

  // Should be served immediately at the new Priority Cashier 2!
  assert.strictEqual(cashiers[3].currentCustomer.id, 2);
  assert.strictEqual(cashiers[3].remainingTime, 25);
  console.log('✓ Test 6 Passed: Dynamic Priority Cashier immediately serves new priority customer');
}

// Test 7: Dynamic addition of a third Regular Cashier
{
  let cashiers = createInitialCashiers();
  // Cashier 1 priority is busy
  cashiers[0].currentCustomer = { id: 1, serviceTime: 30, type: 'priority' };
  cashiers[0].remainingTime = 30;
  // Regular cashiers 2 & 3 are busy
  cashiers[1].currentCustomer = { id: 2, serviceTime: 20, type: 'normal' };
  cashiers[1].remainingTime = 20;
  cashiers[2].currentCustomer = { id: 3, serviceTime: 20, type: 'normal' };
  cashiers[2].remainingTime = 20;

  // Add 3rd Regular Cashier (idle)
  cashiers.push({
    id: 'cashier-4',
    name: 'Regular Cashier 3',
    type: 'regular',
    currentCustomer: null,
    remainingTime: 0,
    queue: [],
  });

  const normalCust = { id: 4, serviceTime: 15, type: 'normal' };
  cashiers = assignSingleCustomer(normalCust, cashiers);

  // Should route to the newly added idle Regular Cashier
  assert.strictEqual(cashiers[3].currentCustomer.id, 4);
  assert.strictEqual(cashiers[3].remainingTime, 15);
  console.log('✓ Test 7 Passed: Dynamic Regular Cashier receives normal customer');
}

console.log('ALL TESTS PASSED SUCCESSFULLY! 🎉');
