import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ padded = true, children, className = '', ...props }) => {
  return (
    <div
      className={`bg-card border border-border rounded-lg transition-shadow duration-200 ${
        padded ? 'p-6' : 'p-0'
      } ${className}`}
      style={{
        borderRadius: 'var(--radius-lg)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};
