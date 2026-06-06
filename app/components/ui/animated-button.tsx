import React from 'react';
import { Button, type ButtonSize, type ButtonVariant } from './button';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  if (loading) {
    return (
      <div className={`relative overflow-visible ${fullWidth ? 'w-full' : 'inline-block'}`}>
        {/* Glow Layer */}
        <div className="absolute inset-[-4px] rounded-xl bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 opacity-60 blur-md animate-pulse-slow"></div>
        {/* Spinner Button */}
        <Button
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          className={`relative z-10 ${className}`}
          disabled={true}
          {...props}
        >
          <div className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{children}</span>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
};
