import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';
import { PinPad } from '~/components/ui/pin-pad';
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
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const pinComplete = pin.length === 4;

  const handleSetup = async () => {
    if (!pinComplete) return;

    setLoading(true);
    try {
      await api.auth.setupPin(pin);
      showToast('Transaction PIN created successfully!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to setup transaction PIN. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-5 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-44 -left-28 w-[620px] h-[620px] rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, var(--tint-c), rgba(0,61,153,0) 70%)' }} />
        <div className="absolute top-28 -right-40 w-[560px] h-[560px] rounded-full" style={{ background: 'radial-gradient(circle at 60% 40%, rgba(59,130,246,0.22), rgba(59,130,246,0) 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-[400px] p-7 sm:p-8 rounded-[22px] text-center glass-surface rad5-pop">
        <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight">Set your transaction PIN</h2>
        <p className="mx-auto text-sm text-text-secondary max-w-[32ch]">
          Four digits. You will enter this to pay, transfer or confirm any wallet action.
        </p>

        <div className="mt-7">
          <PinPad value={pin} onChange={setPin} showConfirmKey={false} disabled={loading} />
        </div>

        <AnimatedButton
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!pinComplete || loading}
          onClick={handleSetup}
          className="mt-5 font-bold"
        >
          Save PIN and continue
        </AnimatedButton>
      </div>
    </div>
  );
}
