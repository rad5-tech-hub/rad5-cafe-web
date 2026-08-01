import React from 'react';
import { GlassPanel } from '../ui/glass-panel';
import { Icon, type IconName } from '../ui/icon';

export type MiniStat = {
  label: string;
  value: string;
  icon: IconName;
  tone?: 'default' | 'success' | 'warning' | 'error';
};

const toneClass: Record<NonNullable<MiniStat['tone']>, string> = {
  default: 'text-tint',
  success: 'text-ok',
  warning: 'text-warn',
  error: 'text-err',
};

/** MiniStatList — a small labeled title + a vertical stack of icon/value rows (Inventory levels, Customer activity, System wallets). */
export const MiniStatList: React.FC<{ title: string; stats: MiniStat[] }> = ({ title, stats }) => (
  <div className="flex flex-col gap-2.5">
    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">{title}</span>
    <div className="flex flex-col gap-2.5">
      {stats.map((s) => (
        <GlassPanel key={s.label} radius="md" className="!p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon name={s.icon} size={16} className={toneClass[s.tone ?? 'default']} />
            <span className="text-xs font-bold truncate">{s.label}</span>
          </div>
          <span className={`text-sm font-extrabold flex-shrink-0 ${toneClass[s.tone ?? 'default']}`}>{s.value}</span>
        </GlassPanel>
      ))}
    </div>
  </div>
);
