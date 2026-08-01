import React from 'react';
import { GlassPanel } from './glass-panel';

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueColor?: string;
  className?: string;
};

/** StatCard — label (12.5px, text-2) + big mono value (24-26px) + small sub caption. */
export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, valueColor, className = '' }) => {
  return (
    <GlassPanel radius="lg" className={className}>
      <div className="text-[12.5px] font-semibold text-text-secondary">{label}</div>
      <div className="font-money text-[25px] font-semibold tracking-tight mt-2" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {sub && <div className="text-xs text-text-secondary mt-1">{sub}</div>}
    </GlassPanel>
  );
};
