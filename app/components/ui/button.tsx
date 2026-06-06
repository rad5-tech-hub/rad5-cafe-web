import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass-blue';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    const solidBase = 'shadow-lg';
    switch (variant) {
      case 'primary':
        return `bg-tint-dark ${solidBase} text-white hover:shadow-tint-dark/40 hover:-translate-y-px active:scale-[0.98]`;
      case 'secondary':
        return `bg-accent ${solidBase} text-white hover:shadow-accent/40 hover:-translate-y-px active:scale-[0.98]`;
      case 'outline':
        return 'glass-subtle text-tint hover:bg-tint/8 active:bg-tint/12';
      case 'ghost':
        return 'bg-transparent text-tint hover:bg-tint/8 active:bg-tint/12';
      case 'danger':
        return `bg-error-val ${solidBase} text-white hover:shadow-error-val/40 hover:-translate-y-px active:scale-[0.98]`;
      case 'glass-blue':
        return 'glass-blue hover:bg-tint-dark/15 active:bg-tint-dark/25 dark:hover:bg-tint-dark/35 dark:active:bg-tint-dark/45';
      default:
        return `bg-tint-dark ${solidBase} text-white`;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm font-semibold rounded-md';
      case 'md':
        return 'px-4 py-2 text-base font-semibold rounded-lg';
      case 'lg':
        return 'px-6 py-4 text-lg font-semibold rounded-xl';
      default:
        return 'px-4 py-2 text-base font-semibold';
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tint/20 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02] ${
        fullWidth ? 'w-full' : ''
      } ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
