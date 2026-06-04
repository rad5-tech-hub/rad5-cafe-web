import React, { useEffect } from 'react';
import { Icon } from './icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity duration-300">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div
        className="relative bg-card border border-border w-full md:max-w-lg flex flex-col shadow-2xl transition-all duration-300 max-h-[90vh] overflow-hidden"
        style={{
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          borderBottomLeftRadius: 'window' in globalThis && window.innerWidth >= 768 ? 'var(--radius-lg)' : '0px',
          borderBottomRightRadius: 'window' in globalThis && window.innerWidth >= 768 ? 'var(--radius-lg)' : '0px',
        }}
      >
        {/* Mobile drag handle bar */}
        <div className="flex md:hidden justify-center py-2 select-none">
          <div className="w-12 h-1 bg-border rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          {title ? (
            <h3 className="text-lg font-bold text-text-main leading-tight">{title}</h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-bg-selected text-text-secondary hover:text-text-main transition-colors focus:outline-none"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
