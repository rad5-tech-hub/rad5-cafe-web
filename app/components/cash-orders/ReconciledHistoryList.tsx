import React, { useEffect, useState, useCallback } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { Button } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';
import type { ReconciledOrder } from './types';

export function ReconciledHistoryList({ onBack }: { onBack: () => void }) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<ReconciledOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchData = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const res = await api.adminDashboard.orders.reconciled(currentPage, limit);
      if (res.success && res.orders) {
        setOrders(res.orders);
        setTotalPages(res.totalPages || 1);
      } else {
        setOrders([]);
      }
    } catch (err) {
      showToast('Failed to load reconciled history', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-text-main">Reconciled History</h2>
          <p className="text-sm text-text-secondary mt-1">
            View cash orders that have been reconciled.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <Icon name="arrow-down" size={16} className="mr-2 rotate-90" />
            Back to Limbo Orders
          </Button>
          <Button variant="outline" onClick={() => fetchData(page)} disabled={loading} title="Refresh">
            <Icon name="sync" size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-element text-text-secondary font-semibold uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Walk-in Name</th>
                <th className="px-4 py-3">Reconciled To</th>
                <th className="px-4 py-3">Reconciled By</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-text-secondary">
                    Loading history...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-text-secondary">
                    No reconciled orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-bg-element/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-main">
                      {order.receiptNumber}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {order.customerAccountName || 'Walk-in Customer'}
                    </td>
                    <td className="px-4 py-3 text-text-main">
                      {order.userId ? (
                        <span className="text-tint font-semibold">{order.userId}</span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {order.reconciledByName || order.reconciledBy || 'System'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-tint">
                      ₦{order.total?.toLocaleString() ?? 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              <Icon name="arrow-down" size={16} className="mr-2 rotate-90" />
              Previous
            </Button>
            <span className="text-sm text-text-secondary font-medium">
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              Next
              <Icon name="arrow-down" size={16} className="ml-2 -rotate-90" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
