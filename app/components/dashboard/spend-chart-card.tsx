import React from 'react';
import { GlassPanel } from '~/components/ui/glass-panel';
import { Money } from '~/components/ui/money';

type SpendChartCardProps = {
  total: number;
  bars: number[]; // 0-100 heights, oldest -> newest
};

/**
 * SpendChartCard — "Spent this month" glass card with a small bar chart,
 * derived from the user's own recent transactions (debits only).
 */
export const SpendChartCard: React.FC<SpendChartCardProps> = ({ total, bars }) => {
  return (
    <GlassPanel radius="lg">
      <div className="text-[12.5px] font-semibold text-text-secondary">Spent this month</div>
      <Money amount={total} className="block text-[25px] font-semibold tracking-tight mt-1.5" />
      <div className="flex items-end gap-1 h-[46px] mt-3.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${Math.max(4, h)}%`,
              background: i === bars.length - 1 ? 'linear-gradient(180deg, var(--color-tint), #3B82F6)' : 'var(--tint-b)',
            }}
          />
        ))}
      </div>
    </GlassPanel>
  );
};
