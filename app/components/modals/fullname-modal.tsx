import React, { useEffect, useState } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface FullNameModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onDone: (fullName: string) => void;
}

export const FullNameModal: React.FC<FullNameModalProps> = ({ isOpen, onDismiss, onDone }) => {
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const isValid = fullName.trim().length >= 2;

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
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div className="absolute inset-0" onClick={onDismiss} />

      <Card
        padded={true}
        className="relative glass-heavy border border-border w-full md:max-w-sm flex flex-col gap-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-hidden"
        style={{
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          borderBottomLeftRadius: 'window' in globalThis && window.innerWidth >= 768 ? 'var(--radius-xl)' : '0px',
          borderBottomRightRadius: 'window' in globalThis && window.innerWidth >= 768 ? 'var(--radius-xl)' : '0px',
        }}
      >
        <div className="flex md:hidden justify-center py-1 select-none">
          <div className="w-12 h-1 bg-border rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-6">
          <div className="text-center flex flex-col gap-1">
            <h3 className="text-xl font-bold text-text-main leading-tight">Welcome to RAD5 Café!</h3>
            <p className="text-text-secondary text-sm leading-normal">
              Please enter your full name so we can better personalise your experience and track your rewards.
            </p>
          </div>

          <Input
            label="Full Name"
            id="fullName"
            type="text"
            placeholder="e.g. Ikechukwu Nwankwo"
            value={fullName}
            onChange={(e) => {
              setError(null);
              setFullName(e.target.value);
            }}
            autoFocus
            error={error ?? undefined}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth={true}
            onClick={handleSubmit}
            disabled={!isValid || loading}
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
