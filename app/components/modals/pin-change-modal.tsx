import React, { useRef, useState, useEffect } from 'react';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface PinChangeModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onDone: () => void;
}

export const PinChangeModal: React.FC<PinChangeModalProps> = ({ isOpen, onDismiss, onDone }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<'new' | 'confirm'>('new');
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.auth.getPinChangeRequest()
        .then((res) => {
          if (res.success && res.data && res.data.status === 'PENDING') {
            setHasPending(true);
          } else {
            setHasPending(false);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPin = step === 'new' ? newPin : confirmPin;
  const pinComplete = currentPin.every((d) => d.length === 1);

  const handlePinChange = (val: string, index: number) => {
    setError(null);
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (cleanVal.length > 1) return;

    const updatedPin = [...currentPin];
    updatedPin[index] = cleanVal;

    if (step === 'new') {
      setNewPin(updatedPin);
    } else {
      setConfirmPin(updatedPin);
    }

    if (cleanVal && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!currentPin[index] && index > 0) {
        const updatedPin = [...currentPin];
        updatedPin[index - 1] = '';
        if (step === 'new') setNewPin(updatedPin);
        else setConfirmPin(updatedPin);
        inputRefs.current[index - 1]?.focus();
      } else {
        const updatedPin = [...currentPin];
        updatedPin[index] = '';
        if (step === 'new') setNewPin(updatedPin);
        else setConfirmPin(updatedPin);
      }
    }
  };

  const handleNext = () => {
    if (!pinComplete) return;
    if (step === 'new') {
      setStep('confirm');
      // Reset ref focus to first digit of confirm pin input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const code = newPin.join('');
    const confirmCode = confirmPin.join('');
    if (code.length !== 4 || confirmCode.length !== 4) return;

    if (code !== confirmCode) {
      setError('PINs do not match. Please try again.');
      setConfirmPin(['', '', '', '']);
      setStep('confirm');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.requestPinChange(code);
      if (res.success) {
        showToast('PIN change request submitted successfully! Please meet any admin to approve your PIN change.', 'success');
        resetState();
        onDone();
      } else {
        setError(res.message || 'Failed to submit PIN change request.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep('new');
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setError(null);
    setHasPending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={() => { resetState(); onDismiss(); }} />

      <Card
        padded={true}
        className="relative bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col gap-6 shadow-2xl animate-scale-up"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <button
          onClick={() => { resetState(); onDismiss(); }}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-selected text-text-secondary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div className="text-center flex flex-col gap-1 mt-2">
          <h3 className="text-xl font-bold text-text-main leading-tight">Change Transaction PIN</h3>
          <p className="text-text-secondary text-sm leading-normal">
            {step === 'new' ? 'Enter your new preferred 4-digit PIN' : 'Confirm your new preferred 4-digit PIN'}
          </p>
        </div>

        {hasPending && step === 'new' && (
          <div className="bg-warning/12 text-warning border border-warning/20 text-xs rounded-xl p-3 leading-relaxed text-center font-medium">
            You currently have a pending PIN change request. Submitting a new PIN will update your existing pending request.
          </div>
        )}

        <div className="flex justify-center gap-3 w-full">
          {currentPin.map((digit, i) => (
            <input
              key={`${step}-${i}`} // Force re-render on step change
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
          onClick={handleNext}
          disabled={!pinComplete || loading}
        >
          {loading ? 'Processing...' : step === 'new' ? 'Next' : 'Request PIN Change'}
        </Button>
      </Card>
    </div>
  );
};
