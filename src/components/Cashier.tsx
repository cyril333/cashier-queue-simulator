import React from 'react';
import { CashierState } from '../types';
import { CustomerList } from './CustomerList';

interface CashierProps {
  cashier: CashierState;
  onRemove?: (id: string) => void;
  canRemove?: boolean;
}

export const Cashier: React.FC<CashierProps> = ({ cashier, onRemove, canRemove }) => {
  const isIdle = !cashier.currentCustomer;

  return (
    <div className={`cashier-card ${cashier.type}`}>
      {canRemove && onRemove && (
        <button
          type="button"
          className="cashier-remove-btn"
          onClick={() => onRemove(cashier.id)}
          title={`Remove ${cashier.name}`}
          aria-label={`Remove ${cashier.name}`}
        >
          &times;
        </button>
      )}
      <h3 className="cashier-title">{cashier.name}</h3>

      <div className={`serving-box ${isIdle ? 'idle' : 'active'}`}>
        {isIdle ? (
          <span className="idle-text">Idle Cashier</span>
        ) : (
          <div className="serving-content">
            <span className="now-serving-title">
              Now serving: Customer {cashier.currentCustomer?.id}
            </span>
            <span className="serving-time">
              ({cashier.remainingTime}secs remaining)
            </span>
          </div>
        )}
      </div>

      <div className="cashier-queue-container">
        <h4 className="queue-header">Queue</h4>
        <div className="queue-list-wrapper">
          <CustomerList
            customers={cashier.queue}
            variant="cashier"
            emptyMessage=""
          />
        </div>
      </div>
    </div>
  );
};
