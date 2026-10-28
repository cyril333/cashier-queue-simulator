import React from 'react';
import { CashierType } from '../types';

interface ControlPanelProps {
  onAddCustomer: () => void;
  onAssignCustomer: () => void;
  onAssignAllCustomers: () => void;
  onAddCashier: (type: CashierType) => void;
  hasWaitingCustomers: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onAddCustomer,
  onAssignCustomer,
  onAssignAllCustomers,
  onAddCashier,
  hasWaitingCustomers,
}) => {
  return (
    <div className="control-panel">
      <h2 className="control-panel-title">Cashier Queue</h2>
      <div className="buttons-container">
        <div className="buttons-row">
          <button
            type="button"
            className="control-btn"
            onClick={onAddCustomer}
            title="Create customer and add to waiting queue"
          >
            Add Customer
          </button>
          <button
            type="button"
            className="control-btn"
            onClick={onAssignCustomer}
            disabled={!hasWaitingCustomers}
            title={hasWaitingCustomers ? 'Assign next customer to appropriate cashier' : 'No customers waiting'}
          >
            Assign Customer
          </button>
        </div>
        <button
          type="button"
          className="control-btn control-btn-full"
          onClick={onAssignAllCustomers}
          disabled={!hasWaitingCustomers}
          title={hasWaitingCustomers ? 'Assign all waiting customers to cashiers' : 'No customers waiting'}
        >
          Assign All Customer
        </button>

        {/* Add New Cashier Section */}
        <div className="add-cashier-section">
          <div className="add-cashier-header">Add New Cashier</div>
          <div className="buttons-row">
            <button
              type="button"
              className="control-btn btn-add-cashier normal"
              onClick={() => onAddCashier('regular')}
              title="Add a new Normal Cashier"
            >
              Normal
            </button>
            <button
              type="button"
              className="control-btn btn-add-cashier priority"
              onClick={() => onAddCashier('priority')}
              title="Add a new Priority Cashier"
            >
              Priority
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
