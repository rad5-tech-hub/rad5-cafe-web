import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  searchable?: boolean;
}

function getOptionText(label: React.ReactNode): string {
  if (typeof label === 'string') return label;
  if (typeof label === 'number') return String(label);
  if (label == null) return '';
  if (Array.isArray(label)) return label.map(getOptionText).join(' ');
  if (React.isValidElement(label)) {
    const props = label.props as Record<string, unknown>;
    if (props.children != null) {
      if (typeof props.children === 'string') return props.children;
      if (Array.isArray(props.children)) {
        return (props.children as React.ReactNode[]).map(getOptionText).join(' ');
      }
      return String(props.children);
    }
    return '';
  }
  return '';
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
  searchable = true,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) =>
      getOptionText(opt.label).toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q)
    );
  }, [options, searchQuery, searchable]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery('');
  }, [disabled]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if the click was inside the dropdown portal
        if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }
    
    function handleScroll(event: Event) {
      if (isOpen) {
        // Don't close if scrolling inside the dropdown itself
        if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch scroll on any element
      
      // Calculate position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
        });
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const dropdownContent = isOpen && typeof document !== 'undefined' ? createPortal(
    <div 
      ref={dropdownRef}
      className="bg-card border border-border rounded-xl shadow-2xl py-2 max-h-80 overflow-hidden flex flex-col animate-fade-in"
      style={dropdownStyle}
    >
      {searchable && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-bg-element border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:border-tint"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      <div className="overflow-y-auto max-h-60 flex-1">
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-3 text-sm text-text-secondary">
            {searchQuery.trim() ? 'No matching options' : 'No options available'}
          </div>
        ) : (
          filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                setSearchQuery('');
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
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
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

      {dropdownContent}
    </div>
  );
}
