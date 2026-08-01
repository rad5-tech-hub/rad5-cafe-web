import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { useConfirm } from '~/context/confirm-context';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';
import { PinChangeModal } from '~/components/modals/pin-change-modal';
import { PinSetupModal } from '~/components/modals/pin-setup-modal';
import { IdentityCard } from '~/components/profile/identity-card';
import { PinChangeCard } from '~/components/profile/pin-change-card';
import { AccountCard } from '~/components/profile/account-card';

export function meta() {
  return [
    { title: "Profile & Security - RAD5 Café" },
    { name: "description", content: "Manage your RAD5 Café account and transaction PIN." },
  ];
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { showConfirm } = useConfirm();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [pinRequest, setPinRequest] = useState<any>(null);
  const [showPinReset, setShowPinReset] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  const fetchProfile = () => {
    if (!user) return;
    api.auth.me().then((res) => {
      if (res.success && res.data) setProfile(res.data);
    }).catch(() => {});

    api.auth.getPinChangeRequest().then((res) => {
      if (res.success) setPinRequest(res.data);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const displayName = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join('') || 'U';

  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@rad5.cafe' || profile?.email === 'admin@rad5.cafe';

  const handleSignOut = async () => {
    const confirmed = await showConfirm({
      title: 'Sign out of RAD5 Café?',
      message: 'Your wallet stays safe. You will need your password and PIN again next time.',
      variant: 'danger',
      confirmLabel: 'Sign out',
      cancelLabel: 'Stay',
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await signOut();
      showToast('Signed out successfully.', 'success');
      navigate('/login');
    } catch {
      showToast('Failed to sign out. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = () => {
    if (isAdmin) {
      navigate('/dashboard');
    } else {
      navigate('/admin');
    }
  };

  const profileRows = [
    { label: 'Wallet ID', value: profile?.walletId || 'RAD500000' },
    { label: 'Email', value: user?.email || '—' },
    { label: 'Role', value: isAdmin ? 'Admin' : 'Customer' },
    { label: 'Transaction PIN', value: profile?.pinSetup ? 'Configured' : 'Not set' },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Profile &amp; security</h1>
        <p className="text-text-secondary text-xs mt-1">Manage your RAD5 Café identity, PIN and account access.</p>
      </div>

      <div className="grid gap-4.5 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <IdentityCard
          initials={initials}
          name={displayName}
          email={user?.email || ''}
          rows={profileRows}
        />

        <div className="grid gap-3.5">
          <PinChangeCard
            pinSetup={!!profile?.pinSetup}
            requestStatus={pinRequest?.status}
            rejectReason={pinRequest?.rejectReason}
            onRequest={() => (profile?.pinSetup ? setShowPinReset(true) : setShowPinSetup(true))}
          />
          <AccountCard
            isAdmin={isAdmin}
            roleSwitchLabel={isAdmin ? 'Go to my wallet' : 'Go to admin console'}
            onRoleSwitch={handleRoleSwitch}
            onSignOut={handleSignOut}
            signingOut={loading}
          />
        </div>
      </div>

      <PinChangeModal
        isOpen={showPinReset}
        onDismiss={() => setShowPinReset(false)}
        onDone={() => {
          setShowPinReset(false);
          fetchProfile();
        }}
      />

      <PinSetupModal
        isOpen={showPinSetup}
        onDismiss={() => setShowPinSetup(false)}
        onDone={() => {
          setShowPinSetup(false);
          fetchProfile();
        }}
      />
    </div>
  );
}
