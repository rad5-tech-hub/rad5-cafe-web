import React from 'react';
import { GlassPanel } from '../ui/glass-panel';

type AccountCardProps = {
  isAdmin: boolean;
  roleSwitchLabel: string;
  onRoleSwitch: () => void;
  onSignOut: () => void;
  signingOut?: boolean;
};

/** AccountCard — role blurb + role-switch action + sign-out, mirrors the spec's Account card. */
export const AccountCard: React.FC<AccountCardProps> = ({ isAdmin, roleSwitchLabel, onRoleSwitch, onSignOut, signingOut }) => {
  return (
    <GlassPanel radius="lg" className="p-5.5">
      <div className="text-sm font-bold">Account</div>
      <p className="mt-1 text-[13px] text-text-secondary leading-relaxed">
        {isAdmin ? 'You have admin access to the RAD5 console.' : 'You are signed in with a personal RAD5 Café account.'}
      </p>
      <div className="flex gap-2.5 mt-4 flex-wrap">
        <button
          onClick={onRoleSwitch}
          className="px-4 py-2.5 rounded-[11px] border-none bg-tint-dark text-white text-[13.5px] font-semibold cursor-pointer hover:bg-tint transition-colors"
        >
          {roleSwitchLabel}
        </button>
        <button
          onClick={onSignOut}
          disabled={signingOut}
          className="px-4 py-2.5 rounded-[11px] border text-[13.5px] font-semibold cursor-pointer transition-colors disabled:opacity-50"
          style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.06)', color: '#EF4444' }}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </GlassPanel>
  );
};
