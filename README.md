# Cashier Queue Simulator

A React application simulating a multi-counter cashier queue system based on the specifications in the provided PDF.

Built with **React 19**, **TypeScript**, and **Vite**, making extensive and effective use of `useState` and `useEffect` hooks.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` (or the port Vite outputs).

### 3. Build for Production
```bash
npm run build
```

---

## 📋 Features & Specifications Implementation

### 1. Add Customer
- **Functionality**: Creates a customer and appends them to the Waiting Queue.
- **Service Time**: Random integer from **5 to 100 seconds**.
- **Customer Type**: Either **Priority** or **Normal**.
- **Color Coding**:
  - 🔴 **Priority Customers**: Highlighted in vibrant **Red**.
  - 🔵 **Normal Customers**: Highlighted in vibrant **Blue**.
- **Format**: Displayed with bullet points: `• ID : {id} | {serviceTime}`.
- When empty: Displays `No customers waiting.`.

### 2. Assign Customer
- **Functionality**: Takes the next customer from the Waiting Queue and assigns them to an appropriate cashier.
- **Type-Matching & Queue Rules**:
  - **Priority Customers**: Always assigned to the **Priority Cashier**. If the cashier is idle, they are served immediately; otherwise, they wait in the Priority Cashier's queue.
  - **Normal Customers**:
    - **Rule**: *"If priority cashier is empty, normal customer can be served"*. If the Priority Cashier has no current customer and no queue, the normal customer is served there immediately.
    - Otherwise, they are routed to the **Regular Cashier with the shortest queue**.
  - **Shortest Queue**: Load-balanced across regular cashiers (with first regular cashier as tie-breaker).

### 3. Assign All Customers
- Reuses the exact same assignment logic as `assignCustomer` sequentially for all waiting customers, then clears the waiting queue.

### 4. Real-Time Ticking & Service Flow
- Every active cashier displays:
  - `Now serving: Customer {id}`
  - `({remainingTime}secs remaining)`
- Time ticks down once every second.
- When a customer's remaining time reaches `0`:
  - The customer finishes service.
  - The cashier dequeues the next customer from its queue and starts serving them.
  - If the queue is empty, the cashier displays `Idle Cashier`.

---

## 🧩 Component Architecture

- **`Cashier`** (`src/components/Cashier.tsx`):
  - Encapsulates individual cashier state display, now-serving card, remaining countdown, and cashier-specific queue.
- **`CustomerList`** (`src/components/CustomerList.tsx`):
  - Reusable component for displaying color-coded customers in both the Waiting Queue (`• ID : {id} | {serviceTime}`) and Cashier Queues (`• Customer #{id} ({time} secs)`).
- **`WaitingQueue`** (`src/components/WaitingQueue.tsx`):
  - Panel rendering the waiting customers and empty state.
- **`ControlPanel`** (`src/components/ControlPanel.tsx`):
  - Cyan-panel header with `Add Customer`, `Assign Customer`, and `Assign All Customer` actions.
- **`App`** (`src/App.tsx`):
  - Manages global state, timer subscriptions, and user interactions.

---

## 🪝 Effective Use of React Hooks

- **`useState`**:
  - `waitingQueue`: Tracks customers waiting to be assigned.
  - `cashiers`: Holds the state of all 3 cashiers (Priority, Regular 1, Regular 2), their currently serving customer, remaining seconds, and queues.
  - `nextCustomerId`: Auto-incrementing customer ID starting from 0.
  - `simulationSpeed`: Supports 1x, 2x, 5x, and 10x speeds for fast testing.
  - `isPaused`: Pause/resume the ticking timer.
  - `autoAssign`: Optional hands-free queue assignment toggle.
  - `stats`: Real-time tracking of total created, total served, priority served, and normal served.

- **`useEffect`**:
  - **Countdown Timer**: Subscribes to a precise `setInterval` interval, recalculating and decrementing the `remainingTime` for each active cashier, dequeuing subsequent queued customers, and transitioning to `Idle Cashier` when done.
  - **Auto-Assigner**: When toggled, automatically processes incoming customers into available queues.
  - **Celebration Trigger**: Fires confetti celebration when customer queues are cleared.

---

## 🧪 Testing

An automated test suite is included in `test-simulator.mjs` verifying all edge cases:
```bash
node test-simulator.mjs
```
