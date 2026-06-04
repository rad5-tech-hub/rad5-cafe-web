import React, { useRef, useState } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface AdminPinSetupModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onDone: () => void;
}

export const AdminPinSetupModal: React.FC<AdminPinSetupModalProps> = ({ isOpen, onDismiss, onDone }) => {
  const { showToast } = useToast();
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!isOpen) return null;

  const pinComplete = pin.every((d) => d.length === 1);

  const handlePinChange = (val: string, index: number) => {
    setError(null);
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (cleanVal.length > 1) return;

    const newPin = [...pin];
    newPin[index] = cleanVal;
    setPin(newPin);

    if (cleanVal && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
    }
  };

  const handleSubmit = async () => {
    const code = pin.join('');
    if (code.length !== 4) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.adminDashboard.auth.setupPin(code);
      if (res.success) {
        showToast('Admin PIN set up successfully!', 'success');
        onDone();
      } else {
        setError(res.message || 'Failed to set admin PIN.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onDismiss} />

      <Card
        padded={true}
        className="relative bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col gap-6 shadow-2xl animate-scale-up"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <div className="text-center flex flex-col gap-1">
          <h3 className="text-xl font-bold text-text-main leading-tight">Set Up Admin PIN</h3>
          <p className="text-text-secondary text-sm leading-normal">
            Create a 4-digit PIN to authorize admin operations
          </p>
        </div>

        <div className="flex justify-center gap-3 w-full">
          {pin.map((digit, i) => (
            <input
              key={i}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              value={digit}
              onChange={(e) => handlePinChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="w-12 h-14 text-center text-2xl font-extrabold text-text-main bg-bg-element border-2 border-border rounded-xl outline-none focus:outline-none focus:border-tint transition-all"
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <div className="text-center text-xs font-semibold text-error-val">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth={true}
          onClick={handleSubmit}
          disabled={!pinComplete || loading}
        >
          {loading ? 'Setting up...' : 'Set Admin PIN'}
        </Button>
      </Card>
    </div>
  );
};
