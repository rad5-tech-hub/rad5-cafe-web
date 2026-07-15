import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '~/lib/firebase';
import { api } from '~/lib/api';
import { Card } from '~/components/ui/card';
import { Icon } from '~/components/ui/icon';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { useToast } from '~/context/toast-context';
import { AdminPinSetupModal } from '~/components/modals/admin-pin-setup-modal';
import { useNotifications } from '~/context/notification-context';

export function meta() {
  return [
    { title: "Admin Panel - RAD5 Café" },
    { name: "description", content: "Management console for RAD5 Café staff." },
  ];
}

type StatCardProps = {
  label: string;
  value: string;
  icon: any;
  variant?: 'default' | 'success' | 'warning' | 'error';
};

function StatCard({ label, value, icon, variant = 'default' }: StatCardProps) {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return 'text-success bg-success/15';
      case 'warning':
        return 'text-warning bg-warning/15';
      case 'error':
        return 'text-error-val bg-error-val/15';
      case 'default':
      default:
        return 'text-tint bg-tint/15';
    }
  };

  return (
    <Card className="flex flex-col gap-2 items-center text-center p-5 select-none hover:scale-[1.02] transition-transform duration-200 shadow-xs">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColors()}`}>
        <Icon name={icon} size={20} />
      </div>
      <span className="text-xl font-extrabold text-text-main tabular-nums select-all">{value}</span>
      <span className="text-xs font-semibold text-text-secondary select-all">{label}</span>
    </Card>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { permissionStatus, registerWebPush } = useNotifications();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Wallet form state
  const [walletUserId, setWalletUserId] = useState('');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDesc, setWalletDesc] = useState('');
  const [walletPin, setWalletPin] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  const [adminPinSetupNeeded, setAdminPinSetupNeeded] = useState(false);
  const [showAdminPinSetup, setShowAdminPinSetup] = useState(false);

  const fetchAdminData = () => {
    setLoading(true);
    setAlerts([]);

    api.adminDashboard.overview()
      .then((res) => {
        const overview = res.data ?? res;
        if (overview) {
          setStats(overview);
        }
      })
      .catch((err) => {
        console.warn('Could not load admin dashboard stats:', err);
      });

    api.adminDashboard.alerts.list()
      .then((res) => {
        const list = res.data ?? res;
        if (res.success && Array.isArray(list)) {
          setAlerts(list);
        }
      })
      .catch((err) => {
        console.warn('Could not load alerts:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData();

    api.adminDashboard.auth.me()
      .then((res) => {
        if (res.success && res.data && res.data.pinSetup === false) {
          setAdminPinSetupNeeded(true);
          setShowAdminPinSetup(true);
        }
      })
      .catch(() => {
        // fallback: check user /auth/me for adminPinSetup field
        api.auth.me().then((res: any) => {
          if (res.success && res.data) {
            if (res.data.adminPinSetup === false || (!res.data.adminPinSetup && res.data.pinSetup === false)) {
              setAdminPinSetupNeeded(true);
              setShowAdminPinSetup(true);
            }
          }
        }).catch(() => {});
      });

    // Request Notification permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Set up Firebase listener for new orders
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(1));
    
    let initialLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (initialLoad) {
        initialLoad = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = change.doc.data();
          if ('Notification' in window && Notification.permission === 'granted') {
            const itemsStr = order.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ');
            const body = `Customer: ${order.customerName || 'Unknown'}\nProducts: ${itemsStr}`;
            new Notification('New Order Placed!', { body });
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      const res = await api.adminDashboard.alerts.acknowledge(id);
      if (res.success) {
        showToast('Alert acknowledged successfully', 'success');
        setAlerts((prev) => prev.filter((a) => (a.id ?? a._id) !== id));
        // Refresh overview
        api.adminDashboard.overview().then((res) => {
          if (res.success && res.data) setStats(res.data);
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to acknowledge alert', 'error');
    }
  };

  const handleWalletAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletUserId.trim() || !walletAmount || !walletPin) {
      showToast('User ID, Amount, and PIN are required.', 'warning');
      return;
    }

    setWalletLoading(true);
    try {
      const res = await api.adminDashboard.wallet.adjust({
        userId: walletUserId.trim(),
        amount: Number(walletAmount),
        description: walletDesc.trim() || 'Admin manual balance adjustment',
        pin: walletPin,
      });

      if (res.success) {
        showToast(`Wallet balance adjusted successfully! New Balance: ₦${res.data?.balance?.toLocaleString()}`, 'success');
        setWalletUserId('');
        setWalletAmount('');
        setWalletDesc('');
        setWalletPin('');
        fetchAdminData(); // Refresh stats
      } else {
        showToast(res.message || 'Balance adjustment failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Balance adjustment failed.', 'error');
    } finally {
      setWalletLoading(false);
    }
  };



  const todayStats = [
    {
      label: 'Revenue Today',
      value: stats?.today ? `₦${Number(stats.today.revenue ?? 0).toLocaleString()}` : '₦0',
      icon: 'dollar' as const,
      variant: 'success' as const
    },
    {
      label: 'Calculated Profit',
      value: stats?.today ? `₦${Number(stats.today.profit ?? 0).toLocaleString()}` : '₦0',
      icon: 'trending-up' as const,
      variant: 'success' as const
    },
    {
      label: 'Sales Count',
      value: stats?.today ? `${stats.today.salesCount ?? 0} orders` : '0 orders',
      icon: 'cart' as const,
      variant: 'default' as const
    },
  ];

  const inventoryStats = [
    {
      label: 'Total Products',
      value: stats?.inventory ? `${stats.inventory.totalProducts ?? 0} items` : '0 items',
      icon: 'package-variant-closed' as const,
      variant: 'default' as const
    },
    {
      label: 'Low Stock Alerts',
      value: stats?.inventory ? `${stats.inventory.lowStock ?? 0} alerts` : '0 alerts',
      icon: 'alert-triangle' as const,
      variant: 'warning' as const
    },
    {
      label: 'Out of Stock',
      value: stats?.inventory ? `${stats.inventory.outOfStock ?? 0} items` : '0 items',
      icon: 'block-helper' as const,
      variant: 'error' as const
    },
  ];

  const customerStats = [
    {
      label: 'Total Customers',
      value: stats?.customers ? `${stats.customers.total ?? 0} users` : '0 users',
      icon: 'account-group' as const,
      variant: 'default' as const
    },
    {
      label: 'Active Today',
      value: stats?.customers ? `${stats.customers.active ?? 0} users` : '0 users',
      icon: 'check' as const,
      variant: 'success' as const
    },
  ];

  const walletStats = [
    {
      label: 'Total Wallet Escrow',
      value: stats?.wallet ? `₦${Number(stats.wallet.totalValue ?? 0).toLocaleString()}` : '₦0',
      icon: 'bank' as const,
      variant: 'default' as const
    },
    {
      label: 'Processed Tx',
      value: stats?.wallet ? Number(stats.wallet.totalTransactions ?? 0).toLocaleString() : '0',
      icon: 'sync' as const,
      variant: 'default' as const
    },
  ];

  return (
    <div className="flex flex-col gap-6 select-none max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Staff Console</h1>
          <p className="text-text-secondary text-xs mt-1">
            Monitor inventory, checkout analytics, sales balances, and exports.
          </p>
        </div>
        <Badge label="Active Today" variant="success" />
      </div>

      {permissionStatus !== 'granted' && (
        <div className="bg-tint/10 border border-tint/25 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-tint/20 text-tint flex items-center justify-center flex-shrink-0 animate-pulse-slow">
              <Icon name="bell" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main">Enable Web Notifications</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Receive real-time orders, cash-order reconciliations, and low stock alerts directly in your browser.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              registerWebPush().then(() => {
                showToast('Push notifications registration triggered.', 'success');
              }).catch(() => {
                showToast('Failed to trigger notification registration.', 'error');
              });
            }}
            className="px-4 py-2 bg-tint hover:bg-tint/90 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 whitespace-nowrap"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* Today Performance widgets */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider pl-1">Today's Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {todayStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider pl-1 font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            to="/admin/products/add"
            className="flex flex-col items-center justify-center p-5 bg-card border border-border rounded-2xl hover:bg-bg-selected/35 hover:scale-[1.03] transition-all text-center gap-2 shadow-xs"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <Icon name="plus" size={24} className="text-tint" />
            <span className="text-xs font-bold text-text-main">Add Product</span>
          </Link>

          <Link
            to="/inventory"
            className="flex flex-col items-center justify-center p-5 bg-card border border-border rounded-2xl hover:bg-bg-selected/35 hover:scale-[1.03] transition-all text-center gap-2 shadow-xs"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <Icon name="package-variant-closed" size={24} className="text-text-secondary" />
            <span className="text-xs font-bold text-text-main">Inventory</span>
          </Link>

          <Link
            to="/sales"
            className="flex flex-col items-center justify-center p-5 bg-card border border-border rounded-2xl hover:bg-bg-selected/35 hover:scale-[1.03] transition-all text-center gap-2 shadow-xs"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <Icon name="dollar" size={24} className="text-success" />
            <span className="text-xs font-bold text-text-main">Sales Logs</span>
          </Link>

          <Link
            to="/analytics"
            className="flex flex-col items-center justify-center p-5 bg-card border border-border rounded-2xl hover:bg-bg-selected/35 hover:scale-[1.03] transition-all text-center gap-2 shadow-xs"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <Icon name="trending-up" size={24} className="text-tint" />
            <span className="text-xs font-bold text-text-main">Analytics</span>
          </Link>

          <Link
            to="/reports"
            className="flex flex-col items-center justify-center p-5 bg-card border border-border rounded-2xl hover:bg-bg-selected/35 hover:scale-[1.03] transition-all text-center gap-2 shadow-xs"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <Icon name="file-document" size={24} className="text-warning" />
            <span className="text-xs font-bold text-text-main">Export Reports</span>
          </Link>

          <Link
            to="/admin/rewards"
            className="flex flex-col items-center justify-center p-5 bg-card border border-border rounded-2xl hover:bg-bg-selected/35 hover:scale-[1.03] transition-all text-center gap-2 shadow-xs"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <Icon name="star-circle" size={24} className="text-success" />
            <span className="text-xs font-bold text-text-main">Rewards Given</span>
          </Link>
        </div>
      </div>

      {/* Grid of Sections (Inventory, Customers, Wallets) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* Inventory Summary */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">Inventory Levels</span>
          <div className="flex flex-col gap-3">
            {inventoryStats.map((stat) => (
              <Card key={stat.label} className="p-4.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <Icon name={stat.icon} className={stat.variant === 'error' ? 'text-error-val' : stat.variant === 'warning' ? 'text-warning' : 'text-text-secondary'} />
                  <span className="text-xs font-bold text-text-main">{stat.label}</span>
                </div>
                <span className={`text-sm font-extrabold ${stat.variant === 'error' ? 'text-error-val' : stat.variant === 'warning' ? 'text-warning' : 'text-tint'}`}>
                  {stat.value}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {/* Customer Activity */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">Customer Activity</span>
          <div className="flex flex-col gap-3">
            {customerStats.map((stat) => (
              <Card key={stat.label} className="p-4.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <Icon name={stat.icon} className="text-text-secondary" />
                  <span className="text-xs font-bold text-text-main">{stat.label}</span>
                </div>
                <span className="text-sm font-extrabold text-tint">{stat.value}</span>
              </Card>
            ))}
          </div>
        </div>

        {/* Smart Wallet Escrows */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">System Wallets</span>
          <div className="flex flex-col gap-3">
            {walletStats.map((stat) => (
              <Card key={stat.label} className="p-4.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <Icon name={stat.icon} className="text-text-secondary" />
                  <span className="text-xs font-bold text-text-main">{stat.label}</span>
                </div>
                <span className="text-sm font-extrabold text-tint">{stat.value}</span>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Admin Actions (Alerts log and Manual Wallet control) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Left Column: Stock Alerts */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
            Low Stock Alerts ({alerts.length})
          </span>
          <Card padded={false} className="flex flex-col overflow-hidden max-h-[350px] overflow-y-auto shadow-xs">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-text-secondary text-xs">
                All inventory products are above safety threshold levels.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {alerts.map((alert) => (
                  <div key={alert.id || alert._id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-text-main">
                        {alert.productName}
                      </span>
                      <span className="text-xs text-text-secondary">
                        Stock: <strong className="text-error-val">{alert.currentStock}</strong> / threshold: {alert.threshold}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcknowledgeAlert(alert.id || alert._id)}
                      className="text-xs font-bold cursor-pointer"
                    >
                      Acknowledge
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Secure Wallet Adjustment Form */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
            Manual Wallet Operation
          </span>
          <Card className="flex flex-col gap-4 shadow-xs">
            <form onSubmit={handleWalletAdjust} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Customer User ID"
                  placeholder="e.g. RAD500042"
                  value={walletUserId}
                  onChange={(e) => setWalletUserId(e.target.value)}
                  required
                />
                <Input
                  label="Amount (₦)"
                  placeholder="e.g. 5000 or -2000"
                  type="number"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Adjustment Reason"
                placeholder="Compensation refund for billing issue"
                value={walletDesc}
                onChange={(e) => setWalletDesc(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3 items-end pt-2 border-t border-border mt-1">
                <Input
                  label="Transaction PIN"
                  placeholder="4-digit PIN"
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  value={walletPin}
                  onChange={(e) => setWalletPin(e.target.value.replace(/\D/g, ''))}
                  required
                  autoComplete="new-password"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  fullWidth={true}
                  disabled={walletLoading}
                >
                  {walletLoading ? 'Adjusting...' : 'Perform Adjustment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <AdminPinSetupModal
        isOpen={showAdminPinSetup}
        onDismiss={() => setShowAdminPinSetup(false)}
        onDone={() => {
          setShowAdminPinSetup(false);
          setAdminPinSetupNeeded(false);
        }}
      />
    </div>
  );
}
