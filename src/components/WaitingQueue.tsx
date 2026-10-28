import React from 'react';
import { Customer } from '../types';
import { CustomerList } from './CustomerList';

interface WaitingQueueProps {
  customers: Customer[];
}

export const WaitingQueue: React.FC<WaitingQueueProps> = ({ customers }) => {
  return (
    <div className="waiting-queue-panel">
      <h3 className="waiting-queue-header">
        <span>Waiting</span>
        <span>Queue</span>
      </h3>
      <div className="waiting-list-scroll">
        <CustomerList
          customers={customers}
          variant="waiting"
          emptyMessage="No customers waiting."
        />
      </div>
    </div>
  );
};
