import React, { useState } from 'react';
import { GlassSheet } from '../ui/glass-panel';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';

interface FullNameModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onDone: (fullName: string) => void;
}

/** FullNameModal — the "what should we call you?" name-prompt overlay. */
export const FullNameModal: React.FC<FullNameModalProps> = ({ isOpen, onDismiss, onDone }) => {
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isValid = fullName.trim().length >= 2;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleSubmit = async () => {
    if (!isValid) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.saveFullName(fullName.trim());
      if (res.success) {
        showToast('Thank you! Your full name has been saved.', 'success');
        onDone(fullName.trim());
      } else {
        setError(res.message || 'Failed to save full name.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-[58] grid place-items-center p-5"
      style={{ background: 'rgba(17,24,39,0.4)', backdropFilter: 'blur(6px)' }}
    >
      <GlassSheet onClick={stop} className="w-full animate-rad5-pop" style={{ maxWidth: 380 }}>
        <h2 className="text-xl font-extrabold tracking-tight">What should we call you?</h2>
        <p className="mt-1.5 text-[13.5px] text-text-secondary">This shows on your receipts and the café pickup screen.</p>

        <input
          type="text"
          value={fullName}
          onChange={(e) => {
            setError(null);
            setFullName(e.target.value);
          }}
          placeholder="Full name"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full mt-4 px-3.5 py-3 rounded-[11px] border border-border bg-card text-[14.5px] outline-none transition-all focus:border-tint focus:shadow-[0_0_0_3px_var(--tint-b)]"
        />
        {error && <div className="mt-2 text-xs font-semibold text-error-val">{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full mt-4.5 py-3.5 rounded-xl border-none bg-tint-dark text-white text-[14.5px] font-bold cursor-pointer hover:bg-tint disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </GlassSheet>
    </div>
  );
};
