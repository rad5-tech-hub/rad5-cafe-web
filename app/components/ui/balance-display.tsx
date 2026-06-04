import React from 'react';
import { Icon, type IconName } from './icon';

type ActionButton = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

type BalanceDisplayProps = {
  label: string;
  amount: number;
  subtitle?: string;
  actions?: ActionButton[];
};

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  label,
  amount,
  subtitle,
  actions,
}) => {
  return (
    <div
      className="relative text-white overflow-hidden p-6 md:p-8 flex flex-col gap-1.5 transition-all duration-300 shadow-lg hover:shadow-xl"
      style={{
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-tint)',
      }}
    >
      {/* Background Image */}
      <img
        src="https://media.istockphoto.com/id/496564915/photo/bread-and-buns.jpg?s=612x612&w=0&k=20&c=qkmz5pViJ-4T5PLSLYRjmp_HAZ5-VAcar4zaZ-rzMA8="
        alt="Bakery background"
        className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-25 select-none pointer-events-none"
      />
      {/* Linear Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-r pointer-events-none select-none"
        style={{
          backgroundImage: 'linear-gradient(to right, var(--color-tint) 0%, rgba(0, 61, 153, 0.85) 45%, rgba(0, 61, 153, 0.6) 75%, transparent 100%)',
        }}
      />

      {/* Label */}
      <span className="relative z-10 text-sm font-medium opacity-85 uppercase tracking-wider">
        {label}
      </span>

      {/* Amount */}
      <span className="relative z-10 text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums select-all">
        ₦{amount.toLocaleString()}
      </span>

      {/* Subtitle */}
      {subtitle && (
        <span className="relative z-10 text-xs md:text-sm opacity-75 mt-1 select-all">
          {subtitle}
        </span>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-3 mt-6">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onPress}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-white/20 hover:bg-white/30 active:bg-white/15 transition-all duration-200 rounded-full select-none hover:scale-[1.03] cursor-pointer"
            >
              <Icon name={action.icon} size={15} color="#FFFFFF" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
