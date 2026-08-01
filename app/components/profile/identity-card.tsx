import React from 'react';
import { GlassPanel } from '../ui/glass-panel';

type ProfileRow = { label: string; value: React.ReactNode };

type IdentityCardProps = {
  initials: string;
  name: string;
  email: string;
  rows: ProfileRow[];
};

/** IdentityCard — avatar + name/email header, plus a read-only key/value profile-rows table. */
export const IdentityCard: React.FC<IdentityCardProps> = ({ initials, name, email, rows }) => {
  return (
    <GlassPanel radius="lg" className="p-6">
      <div className="flex items-center gap-3.5">
        <span
          className="w-[52px] h-[52px] flex-shrink-0 rounded-full grid place-items-center text-white text-[17px] font-bold"
          style={{ background: 'linear-gradient(140deg, #003D99, #3B82F6)' }}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <div className="text-lg font-bold tracking-tight truncate">{name}</div>
          <div className="text-[13px] text-text-secondary truncate">{email}</div>
        </div>
      </div>

      <div className="mt-5.5 grid gap-px rounded-[14px] overflow-hidden border border-border bg-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 px-4 py-3.5 bg-card">
            <span className="text-[13px] text-text-secondary">{r.label}</span>
            <span className="ml-auto font-money text-[13.5px] font-semibold text-right truncate">{r.value}</span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
};
