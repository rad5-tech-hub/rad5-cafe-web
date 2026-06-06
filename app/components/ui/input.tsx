import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  labelClassName = '',
  className = '',
  id,
  type,
  onWheel,
  ...props
}) => {
  const handleWheel = type === 'number' && !onWheel
    ? (e: React.WheelEvent<HTMLInputElement>) => { (e.target as HTMLInputElement).blur(); }
    : onWheel;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className={`text-sm font-semibold text-text-main select-none ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        onWheel={handleWheel}
        className={`bg-bg-element border text-text-main text-base outline-none transition-all duration-200 w-full placeholder:text-text-secondary/60 ${
          error ? 'border-error-val focus:border-error-val' : 'border-border focus:border-tint focus:shadow-md focus:shadow-tint/10'
        } ${className}`}
        style={{
          borderWidth: '1.5px',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          ...props.style,
        }}
        {...props}
      />
      {error && (
        <span className="text-xs font-semibold text-error-val mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};
