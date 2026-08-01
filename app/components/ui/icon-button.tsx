import React from 'react';
import { Icon, type IconName } from './icon';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  size?: 36 | 40;
  iconSize?: number;
  variant?: 'glass' | 'solid';
}

/** IconButton — 40x40 (or 36x36) glass square button with a centered stroke icon. */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 40,
  iconSize = 17,
  variant = 'glass',
  className = '',
  ...props
}) => {
  const dim = size === 36 ? 'w-9 h-9' : 'w-10 h-10';
  return (
    <button
      className={`relative ${dim} rounded-xl grid place-items-center cursor-pointer transition-colors ${
        variant === 'glass'
          ? 'glass-surface text-text-main hover:border-tint hover:text-tint'
          : 'bg-tint-dark text-white hover:bg-tint'
      } ${className}`}
      {...props}
    >
      <Icon name={icon} size={iconSize} color="currentColor" />
    </button>
  );
};
