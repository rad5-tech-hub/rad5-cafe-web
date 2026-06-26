import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './icon';

export interface SelectOption {
  label: React.ReactNode;
  value: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-bg-element border ${
          isOpen ? 'border-tint ring-1 ring-tint' : 'border-border'
        } rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-tint cursor-pointer'
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <Icon 
          name="chevron-down" 
          size={16} 
          className={`text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-card border border-border rounded-xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-fade-in">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-text-secondary">No options available</div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  value === option.value
                    ? 'bg-tint/10 text-tint font-semibold'
                    : 'text-text-main hover:bg-bg-element'
                }`}
              >
                <span className="truncate pr-2">{option.label}</span>
                {value === option.value && <Icon name="check" size={16} className="text-tint flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
