import React, { useState } from 'react';
import { CashOrdersList } from '~/components/cash-orders/CashOrdersList';
import { CreateCashOrdersView } from '~/components/cash-orders/CreateCashOrdersView';
import { ReconciledHistoryList } from '~/components/cash-orders/ReconciledHistoryList';

export function meta() {
  return [
    { title: 'Cash Orders - RAD5 Café' },
  ];
}

export default function CashOrders() {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'history'>('list');

  return (
    <div className="flex flex-col gap-6 select-none pb-20">
      {activeView === 'list' && (
        <CashOrdersList 
          onNewCashOrder={() => setActiveView('create')} 
          onViewHistory={() => setActiveView('history')}
        />
      )}
      {activeView === 'create' && (
        <CreateCashOrdersView onBack={() => setActiveView('list')} />
      )}
      {activeView === 'history' && (
        <ReconciledHistoryList onBack={() => setActiveView('list')} />
      )}
    </div>
  );
}
