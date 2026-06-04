import React from 'react';

export type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', className = '' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'default':
        return 'bg-bg-selected text-text-secondary';
      case 'info':
        return 'bg-tint/15 text-tint';
      case 'success':
        return 'bg-success/15 text-success';
      case 'warning':
        return 'bg-warning/15 text-warning';
      case 'error':
        return 'bg-error-val/15 text-error-val';
      default:
        return 'bg-bg-selected text-text-secondary';
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-bold px-3 py-1 text-xs select-none rounded-full ${getStyles()} ${className}`}
    >
      {label}
    </span>
  );
};
