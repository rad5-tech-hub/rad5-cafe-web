import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';
import { AuthBackground } from '~/components/auth-background';
import { Card } from '~/components/ui/card';
import { AnimatedButton } from '~/components/ui/animated-button';

export function meta() {
  return [
    { title: "Set Transaction PIN - RAD5 Café" },
    { name: "description", content: "Create a 4-digit PIN for secure wallet transactions." },
  ];
}

export default function SetupPin() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (val: string, index: number) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (cleanVal.length > 1) return; // restrict to single digit

    const newPin = [...pin];
    newPin[index] = cleanVal;
    setPin(newPin);

    // Auto-focus next input on entry
    if (cleanVal && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Backspace: clear current cell and focus previous
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

  const handleSetup = async () => {
    const fullPin = pin.join('');
    if (fullPin.length !== 4) return;

    setLoading(true);
    try {
      await api.auth.setupPin(fullPin);
      showToast('Transaction PIN created successfully!', 'success');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to setup transaction PIN. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pinComplete = pin.every((digit) => digit.length === 1);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Slideshow background */}
      <AuthBackground />

      {/* Brand Header */}
      <div className="relative z-10 text-center mb-8 select-none animate-fade-in">
        <h1
          className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md"
          style={{ fontFamily: 'var(--font-rounded)' }}
        >
          Set Transaction PIN
        </h1>
        <p className="text-white/80 text-sm mt-1.5 max-w-xs mx-auto drop-shadow-sm leading-relaxed">
          Create a secure 4-digit PIN to authenticate purchases.
        </p>
      </div>

      {/* Action Card */}
      <Card
        padded={true}
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8 bg-card/65 backdrop-blur-md border border-white/10 shadow-2xl"
      >
        <div className="flex justify-center gap-4 w-full">
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
              autoFocus={i === 0}
              className="w-14 h-16 text-center text-3xl font-extrabold text-white bg-white/10 border-2 rounded-xl outline-none focus:outline-none transition-colors duration-200 select-all"
              style={{
                borderColor: digit ? 'var(--color-tint)' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>

        <AnimatedButton
          variant="primary"
          size="lg"
          fullWidth={true}
          loading={loading}
          disabled={!pinComplete || loading}
          onClick={handleSetup}
        >
          {loading ? 'Setting Up...' : 'Create PIN'}
        </AnimatedButton>
      </Card>
    </div>
  );
}
