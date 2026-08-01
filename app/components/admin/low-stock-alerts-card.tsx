import React from 'react';
import { GlassPanel } from '../ui/glass-panel';

type Alert = {
  id?: string;
  _id?: string;
  productName: string;
  currentStock: number;
  threshold: number;
};

type LowStockAlertsCardProps = {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
};

/** LowStockAlertsCard — scrollable list of active low-stock alerts with an acknowledge action. */
export const LowStockAlertsCard: React.FC<LowStockAlertsCardProps> = ({ alerts, onAcknowledge }) => (
  <div className="flex flex-col gap-2.5">
    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">Low stock alerts ({alerts.length})</span>
    <GlassPanel radius="lg" padded={false} className="max-h-[350px] overflow-y-auto">
      {alerts.length === 0 ? (
        <div className="text-center py-12 text-text-secondary text-xs">All inventory products are above safety threshold levels.</div>
      ) : (
        <div className="divide-y divide-border">
          {alerts.map((alert) => (
            <div key={alert.id || alert._id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-bold truncate">{alert.productName}</span>
                <span className="text-xs text-text-secondary">
                  Stock: <strong className="text-error-val">{alert.currentStock}</strong> / threshold: {alert.threshold}
                </span>
              </div>
              <button
                onClick={() => onAcknowledge((alert.id || alert._id) as string)}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors flex-shrink-0"
              >
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  </div>
);
