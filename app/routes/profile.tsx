import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { useConfirm } from '~/context/confirm-context';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';
import { Badge } from '~/components/ui/badge';
import { PinSetupModal } from '~/components/modals/pin-setup-modal';

export function meta() {
  return [
    { title: "Profile Settings - RAD5 Café" },
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
  const [showPinReset, setShowPinReset] = useState(false);

  const fetchProfile = () => {
    if (user) {
      api.auth.me().then((res) => {
        if (res.success && res.data) {
          setProfile(res.data);
        }
      }).catch(() => {});
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const displayName = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || 'User';
  const userInitials = displayName
    ? displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const handleSignOut = async () => {
    const confirmed = await showConfirm({
      title: 'Sign Out Confirmation',
      message: 'Are you sure you want to sign out of your RAD5 Café account?',
      variant: 'danger',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      await signOut();
      showToast('Signed out successfully.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast('Failed to sign out. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto select-none">
      {/* Profile Detail Card */}
      <Card className="flex flex-col items-center text-center p-8 gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold bg-tint select-none shadow-md"
        >
          {userInitials}
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-text-main">{displayName}</h2>
          <span className="text-sm text-text-secondary">{user?.email}</span>
        </div>
        <Badge
          label={`Wallet ID: ${profile?.walletId || 'RAD500000'}`}
          variant="info"
          className="mt-1 font-mono text-sm px-4 py-1 select-all"
        />
      </Card>

      {/* Profile Settings Actions */}
      <Card padded={false} className="overflow-hidden flex flex-col divide-y divide-border">
        {/* Go to Admin Panel if User is Admin */}
        {(profile?.role === 'admin' || user?.email === 'admin@rad5.cafe' || profile?.email === 'admin@rad5.cafe') && (
          <button
            onClick={() => navigate('/admin')}
            className="flex justify-between items-center px-6 py-4.5 text-sm font-semibold text-text-main hover:bg-bg-selected/35 active:bg-bg-selected/60 transition-colors w-full text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Icon name="chart-bar" className="text-accent" />
              <div className="flex flex-col gap-0.5">
                <span className="text-accent font-bold">Admin Console</span>
                <span className="text-xs text-text-secondary font-medium">Access inventory, sales logs & reports</span>
              </div>
            </div>
            <Icon name="chevron-right" className="text-accent" />
          </button>
        )}

        {/* Reset Transaction PIN */}
        <button
          onClick={() => setShowPinReset(true)}
          className="flex justify-between items-center px-6 py-4.5 text-sm font-semibold text-text-main hover:bg-bg-selected/35 active:bg-bg-selected/60 transition-colors w-full text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Icon name="lock" className="text-text-secondary" />
            <div className="flex flex-col gap-0.5">
              <span>Change Transaction PIN</span>
              <span className="text-xs text-text-secondary font-medium">Reset your secure 4-digit checkout code</span>
            </div>
          </div>
          <Icon name="chevron-right" className="text-text-secondary" />
        </button>

        {/* Notifications config */}
        <button
          onClick={() => navigate('/notifications')}
          className="flex justify-between items-center px-6 py-4.5 text-sm font-semibold text-text-main hover:bg-bg-selected/35 active:bg-bg-selected/60 transition-colors w-full text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Icon name="bell" className="text-text-secondary" />
            <div className="flex flex-col gap-0.5">
              <span>Notifications settings</span>
              <span className="text-xs text-text-secondary font-medium">Manage alerts and messages log</span>
            </div>
          </div>
          <Icon name="chevron-right" className="text-text-secondary" />
        </button>

        {/* Help page */}
        <div className="flex justify-between items-center px-6 py-4.5 text-sm font-semibold text-text-main w-full text-left">
          <div className="flex items-center gap-3">
            <Icon name="file-document" className="text-text-secondary" />
            <div className="flex flex-col gap-0.5">
              <span>App Version</span>
              <span className="text-xs text-text-secondary font-medium">v2.1.0 (Build 42) - Web SPA client</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Logout button */}
      <Button
        variant="danger"
        size="lg"
        fullWidth={true}
        disabled={loading}
        onClick={handleSignOut}
        className="py-4 shadow-md font-bold"
      >
        {loading ? 'Signing Out...' : 'Sign Out'}
      </Button>

      {/* Pin Reset Modal Mount */}
      <PinSetupModal
        isOpen={showPinReset}
        onDismiss={() => setShowPinReset(false)}
        onDone={() => {
          setShowPinReset(false);
          fetchProfile();
        }}
      />
    </div>
  );
}
