import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
    switch (variant) {
      case 'primary':
        return 'bg-tint text-white hover:opacity-90 active:opacity-80';
      case 'secondary':
        return 'bg-accent text-white hover:opacity-90 active:opacity-80';
      case 'outline':
        return 'bg-transparent border-[1.5px] border-tint text-tint hover:bg-tint/5 active:bg-tint/10';
      case 'ghost':
        return 'bg-transparent text-tint hover:bg-tint/5 active:bg-tint/10';
      case 'danger':
        return 'bg-error-val text-white hover:opacity-90 active:opacity-80';
      default:
        return 'bg-tint text-white';
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
