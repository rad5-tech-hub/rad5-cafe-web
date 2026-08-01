import React from 'react';
import { Money } from '~/components/ui/money';

type DashboardHeroProps = {
  balance: number;
  walletId: string;
  masked: boolean;
  onToggleMask: () => void;
  onFund: () => void;
  onTransfer: () => void;
  onOrder: () => void;
  onCopyWalletId?: () => void;
};

/**
 * DashboardHero — the gradient wallet card at the top of the dashboard:
 * balance (mono, maskable), wallet id, and the Fund/Transfer/Order actions.
 */
export const DashboardHero: React.FC<DashboardHeroProps> = ({ balance, walletId, masked, onToggleMask, onFund, onTransfer, onOrder, onCopyWalletId }) => {
  return (
    <div
      className="p-6 sm:p-7 rounded-[20px] text-white rad5-in"
      style={{ background: 'linear-gradient(145deg, #00296B, #003D99 55%, #3B82F6)', boxShadow: '0 26px 60px -30px var(--shadow)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs tracking-wide opacity-80">WALLET BALANCE</div>
          <div className="text-[34px] sm:text-[42px] font-semibold tracking-tight mt-2">
            <Money amount={balance} masked={masked} />
          </div>
          <div
            className={`text-[13px] opacity-80 mt-1.5 ${onCopyWalletId ? 'cursor-pointer hover:opacity-100 underline decoration-white/40' : ''}`}
            onClick={onCopyWalletId}
            title={onCopyWalletId ? 'Click to copy' : undefined}
          >
            Wallet ID: {walletId}
          </div>
        </div>
        <button
          onClick={onToggleMask}
          className="px-3 py-1.5 rounded-lg border border-white/30 bg-white/[0.14] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
        >
          {masked ? 'Show' : 'Hide'}
        </button>
      </div>
      <div className="flex gap-2.5 mt-6">
        <button
          onClick={onFund}
          className="flex-1 py-3 rounded-xl border-none bg-white text-[#00296B] text-[13.5px] font-bold cursor-pointer hover:-translate-y-px transition-transform"
        >
          Fund wallet
        </button>
        <button
          onClick={onTransfer}
          className="flex-1 py-3 rounded-xl border border-white/35 bg-white/[0.14] text-white text-[13.5px] font-bold cursor-pointer hover:bg-white/[0.24] transition-colors"
        >
          Transfer
        </button>
        <button
          onClick={onOrder}
          className="flex-1 py-3 rounded-xl border border-white/35 bg-white/[0.14] text-white text-[13.5px] font-bold cursor-pointer hover:bg-white/[0.24] transition-colors"
        >
          Order food
        </button>
      </div>
    </div>
  );
};
