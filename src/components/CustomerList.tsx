import React from 'react';
import { Customer } from '../types';

interface CustomerListProps {
  customers: Customer[];
  variant?: 'waiting' | 'cashier';
  emptyMessage?: string;
  className?: string;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  variant = 'waiting',
  emptyMessage,
  className = '',
}) => {
  if (customers.length === 0) {
    if (emptyMessage) {
      return (
        <div className="empty-message-container">
          <p className="empty-message">{emptyMessage}</p>
        </div>
      );
    }
    return null;
  }

  return (
    <ul className={`customer-list customer-list-${variant} ${className}`}>
      {customers.map((customer) => {
        const isPriority = customer.type === 'priority';
        const colorClass = isPriority ? 'text-priority' : 'text-normal';

        return (
          <li key={customer.id} className={`customer-item ${colorClass}`}>
            <span className="bullet">•</span>
            <span className="customer-text">
              {variant === 'waiting'
                ? `ID : ${customer.id} | ${customer.serviceTime}`
                : `Customer #${customer.id} (${customer.serviceTime} secs)`}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
