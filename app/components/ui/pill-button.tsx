import React from 'react';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

/**
 * PillButton — the filter chip used for categories, tx filters and date ranges.
 * Active = filled tint-dark bg + white text. Inactive = chip bg + text-3.
 */
export const PillButton: React.FC<PillButtonProps> = ({ active = false, children, className = '', ...props }) => {
  return (
    <button
      className={`px-4 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer border ${
        active
          ? 'bg-tint-dark text-white border-tint-dark shadow-sm'
          : 'glass-chip text-text-tertiary hover:border-tint hover:text-tint'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
