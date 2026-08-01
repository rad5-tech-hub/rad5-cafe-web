import React from 'react';

type MoneyProps = {
  amount: number;
  masked?: boolean;
  showSign?: boolean;
  className?: string;
};

export function formatMoney(amount: number): string {
  return '₦' + Math.round(Math.abs(amount)).toLocaleString('en-US');
}

/**
 * Money — renders a naira amount in IBM Plex Mono (tabular figures), the mono
 * treatment the spec requires for every numeric/money value across the app.
 */
export const Money: React.FC<MoneyProps> = ({ amount, masked = false, showSign = false, className = '' }) => {
  if (masked) {
    return (
      <span className={`font-money tracking-normal ${className}`}>
        <span className="inline-block mr-[1.5px]">₦</span>•••••
      </span>
    );
  }
  const sign = showSign ? (amount > 0 ? '+' : amount < 0 ? '−' : '') : '';
  const formattedNum = Math.round(Math.abs(amount)).toLocaleString('en-US');

  return (
    <span className={`font-money tracking-normal ${className}`}>
      {sign}
      <span className="inline-block mr-[1.5px]">₦</span>
      {formattedNum}
    </span>
  );
};
