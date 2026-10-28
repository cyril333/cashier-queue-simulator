import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Customer, CashierState, CustomerType, CashierType } from './types';
import { ControlPanel } from './components/ControlPanel';
import { WaitingQueue } from './components/WaitingQueue';
import { Cashier } from './components/Cashier';
import {
  INITIAL_CASHIERS_FACTORY,
  assignSingleCustomer,
  tickCashiers,
} from './logic/simulatorLogic';
import confetti from 'canvas-confetti';
import './App.css';

export const App: React.FC = () => {
  // State management using useState hooks
  const [waitingQueue, setWaitingQueue] = useState<Customer[]>([]);
  const [cashiers, setCashiers] = useState<CashierState[]>(INITIAL_CASHIERS_FACTORY);
  const [nextCustomerId, setNextCustomerId] = useState<number>(0);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [autoAssign, setAutoAssign] = useState<boolean>(false);
  const [stats, setStats] = useState({
    totalCreated: 0,
    totalServed: 0,
    priorityServed: 0,
    normalServed: 0,
  });

  const cashiersRef = useRef(cashiers);
  cashiersRef.current = cashiers;

  const waitingQueueRef = useRef(waitingQueue);
  waitingQueueRef.current = waitingQueue;

  /**
   * Add Customer:
   * - Create customer and add to waiting queue
   * - Random service time from 5 - 100
   * - Customer type Priority or Normal
   * - Color code the customers
   */
  const handleAddCustomer = useCallback(() => {
    const serviceTime = Math.floor(Math.random() * (100 - 5 + 1)) + 5;
    // ~40% chance of priority customer, 60% normal
    const type: CustomerType = Math.random() < 0.4 ? 'priority' : 'normal';

    const newCustomer: Customer = {
      id: nextCustomerId,
      serviceTime,
      type,
    };

    setNextCustomerId((prev) => prev + 1);
    setWaitingQueue((prev) => [...prev, newCustomer]);
    setStats((prev) => ({ ...prev, totalCreated: prev.totalCreated + 1 }));
  }, [nextCustomerId]);

  /**
   * Helper to add multiple random customers at once for testing
   */
  const handleAddMultipleCustomers = useCallback((count: number) => {
    setNextCustomerId((startId) => {
      const newCustomers: Customer[] = [];
      for (let i = 0; i < count; i++) {
        const serviceTime = Math.floor(Math.random() * (100 - 5 + 1)) + 5;
        const type: CustomerType = Math.random() < 0.4 ? 'priority' : 'normal';
        newCustomers.push({
          id: startId + i,
          serviceTime,
          type,
        });
      }
      setWaitingQueue((prev) => [...prev, ...newCustomers]);
      setStats((prev) => ({ ...prev, totalCreated: prev.totalCreated + count }));
      return startId + count;
    });
  }, []);

  /**
   * Assign Customer:
   * Single customer assignment to cashier using the assignment rules.
   */
  const handleAssignCustomer = useCallback(() => {
    if (waitingQueue.length === 0) return;

    const [customerToAssign, ...remainingWaiting] = waitingQueue;
    setCashiers((prevCashiers) =>
      assignSingleCustomer(customerToAssign, prevCashiers)
    );
    setWaitingQueue(remainingWaiting);
  }, [waitingQueue, assignSingleCustomer]);

  /**
   * Assign All Customers:
   * "Use the function from [assign customer] for each of the customers in queue"
   */
  const handleAssignAllCustomers = useCallback(() => {
    if (waitingQueue.length === 0) return;

    setCashiers((prevCashiers) => {
      let current = prevCashiers;
      for (const customer of waitingQueue) {
        current = assignSingleCustomer(customer, current);
      }
      return current;
    });

    setWaitingQueue([]);
  }, [waitingQueue, assignSingleCustomer]);

  /**
   * Add New Cashier:
   * Adds either a Normal (regular) or Priority cashier dynamically.
   */
  const handleAddCashier = useCallback((type: CashierType) => {
    setCashiers((prev) => {
      const typeCount = prev.filter((c) => c.type === type).length;
      const typeLabel = type === 'priority' ? 'Priority Cashier' : 'Regular Cashier';
      const name = `${typeLabel} ${typeCount + 1}`;

      const newCashier: CashierState = {
        id: `cashier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        type,
        currentCustomer: null,
        remainingTime: 0,
        queue: [],
      };
      return [...prev, newCashier];
    });
  }, []);

  /**
   * Remove Cashier:
   * Safely returns active/queued customers back to the waiting queue and removes the cashier.
   */
  const handleRemoveCashier = useCallback((cashierId: string) => {
    setCashiers((prev) => {
      const target = prev.find((c) => c.id === cashierId);
      if (!target) return prev;

      const toRequeue: Customer[] = [];
      if (target.currentCustomer) {
        toRequeue.push({
          ...target.currentCustomer,
          serviceTime: target.remainingTime > 0 ? target.remainingTime : target.currentCustomer.serviceTime,
        });
      }
      if (target.queue.length > 0) {
        toRequeue.push(...target.queue);
      }

      if (toRequeue.length > 0) {
        setWaitingQueue((wq) => [...toRequeue, ...wq]);
      }

      return prev.filter((c) => c.id !== cashierId);
    });
  }, []);

  /**
   * Reset the simulator to initial state
   */
  const handleReset = useCallback(() => {
    setWaitingQueue([]);
    setCashiers(INITIAL_CASHIERS_FACTORY());
    setNextCustomerId(0);
    setStats({
      totalCreated: 0,
      totalServed: 0,
      priorityServed: 0,
      normalServed: 0,
    });
  }, []);

  /**
   * Primary Timer useEffect Hook:
   * Display remaining time and time must tick down every second.
   * When remaining time reaches 0, customer finishes and next in queue is served.
   */
  useEffect(() => {
    if (isPaused) return;

    const intervalTime = Math.max(50, Math.floor(1000 / simulationSpeed));
    const timer = setInterval(() => {
      setCashiers((prevCashiers) => {
        const { cashiers: nextCashiers, completedCustomers } = tickCashiers(prevCashiers);

        if (completedCustomers.length > 0) {
          const priorityCount = completedCustomers.filter(
            (c) => c.type === 'priority'
          ).length;
          const normalCount = completedCustomers.length - priorityCount;

          setStats((prev) => ({
            ...prev,
            totalServed: prev.totalServed + completedCustomers.length,
            priorityServed: prev.priorityServed + priorityCount,
            normalServed: prev.normalServed + normalCount,
          }));
        }

        return nextCashiers;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [simulationSpeed, isPaused]);

  /**
   * Optional Auto-Assign useEffect:
   * When autoAssign is toggled ON, automatically assigns customers from the waiting queue
   * as soon as cashiers have capacity or new customers arrive.
   */
  useEffect(() => {
    if (!autoAssign || waitingQueue.length === 0) return;

    const autoAssignTimer = setTimeout(() => {
      handleAssignCustomer();
    }, 400 / simulationSpeed);

    return () => clearTimeout(autoAssignTimer);
  }, [autoAssign, waitingQueue, handleAssignCustomer, simulationSpeed]);

  // Trigger brief celebration when all customers served after reaching 10+
  useEffect(() => {
    const allIdle = cashiers.every((c) => !c.currentCustomer && c.queue.length === 0);
    if (allIdle && waitingQueue.length === 0 && stats.totalServed >= 5 && stats.totalServed === stats.totalCreated) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Safe fallback
      }
    }
  }, [cashiers, waitingQueue, stats]);

  // Derived metrics
  const totalInCashierQueues = cashiers.reduce(
    (sum, c) => sum + (c.currentCustomer ? 1 : 0) + c.queue.length,
    0
  );

  return (
    <div className="simulator-page">
      {/* Page Title */}
      <header className="page-header">
        <h1 className="page-title">Cashier Queue Simulator</h1>
        <p className="page-subtitle">
          Interactive multi-counter queue management simulator built with React, useState, and useEffect
        </p>
      </header>

      {/* Main UI layout matching the PDF wireframe */}
      <main className="simulator-container">
        {/* Leftmost panel: Cyan Cashier Queue control box */}
        <ControlPanel
          onAddCustomer={handleAddCustomer}
          onAssignCustomer={handleAssignCustomer}
          onAssignAllCustomers={handleAssignAllCustomers}
          onAddCashier={handleAddCashier}
          hasWaitingCustomers={waitingQueue.length > 0}
        />

        {/* Middle panel: Waiting Queue component */}
        <WaitingQueue customers={waitingQueue} />

        {/* Right panel: Cashiers section */}
        <section className="cashiers-panel" aria-label="Cashiers">
          <h2 className="cashiers-main-title">Cashiers</h2>
          <div className="cashiers-grid">
            {cashiers.map((cashier) => (
              <Cashier
                key={cashier.id}
                cashier={cashier}
                onRemove={handleRemoveCashier}
                canRemove={cashiers.length > 1}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Simulator Extras: Controls, Statistics & Requirements Checklist */}
      <div className="simulator-extras">
        {/* Simulation Controls & Live Stats */}
        <div className="info-card">
          <h3 className="info-card-title">
            <span role="img" aria-label="dashboard">⚙️</span>
            Simulation Dashboard
          </h3>

          <div className="legend-list">
            <div className="legend-item">
              <span className="legend-dot priority"></span>
              <span className="text-priority">Priority Customer</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot normal"></span>
              <span className="text-normal">Normal Customer</span>
            </div>
          </div>

          <div className="sim-controls-row" style={{ marginBottom: 16 }}>
            <div className="speed-selector" title="Simulation speed">
              <button
                type="button"
                className={`speed-btn ${simulationSpeed === 1 ? 'active' : ''}`}
                onClick={() => setSimulationSpeed(1)}
              >
                1x
              </button>
              <button
                type="button"
                className={`speed-btn ${simulationSpeed === 2 ? 'active' : ''}`}
                onClick={() => setSimulationSpeed(2)}
              >
                2x
              </button>
              <button
                type="button"
                className={`speed-btn ${simulationSpeed === 5 ? 'active' : ''}`}
                onClick={() => setSimulationSpeed(5)}
              >
                5x
              </button>
              <button
                type="button"
                className={`speed-btn ${simulationSpeed === 10 ? 'active' : ''}`}
                onClick={() => setSimulationSpeed(10)}
              >
                10x
              </button>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsPaused((prev) => !prev)}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleAddMultipleCustomers(5)}
              title="Add 5 customers at once"
            >
              +5 Customers
            </button>

            <button
              type="button"
              className="btn-secondary btn-danger"
              onClick={handleReset}
              title="Reset queue simulator"
            >
              Reset
            </button>

            <label className="toggle-wrapper" title="Automatically assign waiting customers">
              <span className="toggle-switch">
                <input
                  type="checkbox"
                  checked={autoAssign}
                  onChange={(e) => setAutoAssign(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </span>
              <span>Auto-Assign</span>
            </label>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-value">{waitingQueue.length}</div>
              <div className="stat-label">In Waiting</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{totalInCashierQueues}</div>
              <div className="stat-label">In Cashiers</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{stats.totalServed}</div>
              <div className="stat-label">Total Served</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{stats.totalCreated}</div>
              <div className="stat-label">Total Created</div>
            </div>
          </div>
        </div>

        {/* Implementation Requirements Checklist */}
        <div className="info-card">
          <h3 className="info-card-title">
            <span role="img" aria-label="checklist">📋</span>
            Specification Reference
          </h3>
          <table className="rules-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Rule Implemented</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Add Customer</strong></td>
                <td>
                  Creates customer with random service time (5–100s), assigned type (Priority/Normal), and color-coded.
                </td>
              </tr>
              <tr>
                <td><strong>Assign Customer</strong></td>
                <td>
                  Single customer assignment to matching cashier type. If Priority Cashier is empty, normal customer can be served. Time ticks down in real-time.
                </td>
              </tr>
              <tr>
                <td><strong>Assign All</strong></td>
                <td>
                  Reuses the exact <code>assignCustomer</code> function sequentially for every waiting customer.
                </td>
              </tr>
              <tr>
                <td><strong>Cashiers &amp; Shortest Queue</strong></td>
                <td>
                  Cashiers and Customer List are dedicated modular components. Customers queue to the shortest queue for their customer type.
                </td>
              </tr>
              <tr>
                <td><strong>Add New Cashier</strong></td>
                <td>
                  Dynamically adds Normal or Priority cashiers. Load balancing and queue assignment automatically scale to any number of cashiers.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
