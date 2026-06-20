import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ padded = true, children, className = '', ...props }) => {
  return (
    <div
      className={`glass hover-card ${
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
