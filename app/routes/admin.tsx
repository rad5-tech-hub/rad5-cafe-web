import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '~/lib/firebase';
import { api } from '~/lib/api';
import { StatCard } from '~/components/ui/stat-card';
import { Money } from '~/components/ui/money';
import { ConsoleTileGrid, type ConsoleTile } from '~/components/admin/console-tile-grid';
import { MiniStatList, type MiniStat } from '~/components/admin/mini-stat-list';
import { LowStockAlertsCard } from '~/components/admin/low-stock-alerts-card';
import { WalletAdjustCard } from '~/components/admin/wallet-adjust-card';
import { useToast } from '~/context/toast-context';
import { AdminPinSetupModal } from '~/components/modals/admin-pin-setup-modal';

export function meta() {
  return [
    { title: "Admin Panel - RAD5 Café" },
    { name: "description", content: "Management console for RAD5 Café staff." },
  ];
}

const CONSOLE_TILES: ConsoleTile[] = [
  { key: 'inventory', title: 'Inventory', sub: 'Stock levels, thresholds & restocking', icon: 'package-variant-closed', to: '/inventory' },
  { key: 'sales', title: 'Sales logs', sub: 'Orders, refunds & daily takings', icon: 'dollar', to: '/sales' },
  { key: 'accounting', title: 'Accounting', sub: 'Reconciliation & variance review', icon: 'cash', to: '/accounting' },
  { key: 'analytics', title: 'Analytics', sub: 'Trends, top products & busy hours', icon: 'trending-up', to: '/analytics' },
  { key: 'stock-balance', title: 'Stock balance out', sub: 'Write off stock loss against profit', icon: 'scale', to: '/admin/stock-balance' },
  { key: 'users', title: 'Users & access', sub: 'Customer accounts, tiers & status', icon: 'account-group', to: '/admin/users' },
  { key: 'rewards', title: 'Rewards given', sub: 'Points & cashback distributed', icon: 'star-circle', to: '/admin/rewards' },
  { key: 'pin-changes', title: 'PIN approvals', sub: 'Review pending PIN change requests', icon: 'lock', to: '/admin/pin-changes' },
  { key: 'add-product', title: 'Add product', sub: 'List a new item on the menu', icon: 'plus', to: '/admin/products/add' },
  { key: 'reports', title: 'Export reports', sub: 'Download revenue & inventory reports', icon: 'file-document', to: '/reports' },
  { key: 'updates', title: 'App updates', sub: 'Publish new Android release info', icon: 'smartphone', to: '/admin/updates' },
];

// Maps a console tile to the permission key that unlocks it.
const TILE_PERMISSIONS: Record<string, string> = {
  inventory: 'inventory',
  sales: 'sales',
  accounting: 'accounting',
  analytics: 'analytics',
  'stock-balance': 'stock_balance',
  users: 'users',
  rewards: 'rewards',
  'pin-changes': 'pin_changes',
  'add-product': 'products',
  reports: 'reports',
  updates: 'updates',
};

export default function Admin() {
  const { showToast } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual wallet adjustment form state
  const [walletUserId, setWalletUserId] = useState('');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDesc, setWalletDesc] = useState('');
  const [walletPin, setWalletPin] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  const [showAdminPinSetup, setShowAdminPinSetup] = useState(false);

  // undefined = still loading; null = full-access admin; array = restricted
  // sub-admin scoped to those permission keys.
  const [permissions, setPermissions] = useState<string[] | null | undefined>(undefined);
  const fullAccess = permissions === null;
  const hasPermission = (key: string) => permissions === undefined || fullAccess || (permissions || []).includes(key);

  const fetchAdminData = () => {
    setLoading(true);

    api.adminDashboard.overview()
      .then((res: any) => {
        const overview = res.data ?? res;
        if (overview) setStats(overview);
      })
      .catch((err: any) => {
        console.warn('Could not load admin dashboard stats:', err);
      });

    api.adminDashboard.alerts.list()
      .then((res: any) => {
        const list = res.data ?? res;
        if (res.success && Array.isArray(list)) setAlerts(list);
      })
      .catch((err: any) => {
        console.warn('Could not load alerts:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.auth.me().then((res: any) => {
      if (res.success && res.data) {
        setPermissions(Array.isArray(res.data.permissions) ? res.data.permissions : null);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAdminData();

    api.adminDashboard.auth.me()
      .then((res: any) => {
        if (res.success && res.data && res.data.pinSetup === false) {
          setShowAdminPinSetup(true);
        }
      })
      .catch(() => {
        api.auth.me().then((res: any) => {
          if (res.success && res.data) {
            if (res.data.adminPinSetup === false || (!res.data.adminPinSetup && res.data.pinSetup === false)) {
              setShowAdminPinSetup(true);
            }
          }
        }).catch(() => {});
      });

    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

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
          const order = change.doc.data() as any;
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
        showToast({ type: 'success', title: 'Alert acknowledged' });
        setAlerts((prev) => prev.filter((a) => (a.id ?? a._id) !== id));
        api.adminDashboard.overview().then((r: any) => {
          if (r.success && r.data) setStats(r.data);
        });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to acknowledge alert', message: err.message });
    }
  };

  const handleWalletAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletUserId.trim() || !walletAmount || !walletPin) {
      showToast({ type: 'warning', title: 'User ID, amount and PIN are required.' });
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
        showToast({ type: 'success', title: 'Wallet balance adjusted', message: `New balance: ${res.data?.balance != null ? '₦' + Number(res.data.balance).toLocaleString() : ''}` });
        setWalletUserId('');
        setWalletAmount('');
        setWalletDesc('');
        setWalletPin('');
        fetchAdminData();
      } else {
        showToast({ type: 'error', title: 'Balance adjustment failed', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Balance adjustment failed', message: err.message });
    } finally {
      setWalletLoading(false);
    }
  };

  const inventoryStats: MiniStat[] = [
    { label: 'Total products', value: `${stats?.inventory?.totalProducts ?? 0} items`, icon: 'package-variant-closed' },
    { label: 'Low stock alerts', value: `${stats?.inventory?.lowStock ?? 0} alerts`, icon: 'alert-triangle', tone: 'warning' },
    { label: 'Out of stock', value: `${stats?.inventory?.outOfStock ?? 0} items`, icon: 'block-helper', tone: 'error' },
  ];

  const customerStats: MiniStat[] = [
    { label: 'Total customers', value: `${stats?.customers?.total ?? 0} users`, icon: 'account-group' },
    { label: 'Active today', value: `${stats?.customers?.active ?? 0} users`, icon: 'check', tone: 'success' },
  ];

  const walletStats: MiniStat[] = [
    { label: 'Total wallet escrow', value: stats?.wallet ? `₦${Number(stats.wallet.totalValue ?? 0).toLocaleString()}` : '₦0', icon: 'bank' },
    { label: 'Processed tx', value: stats?.wallet ? Number(stats.wallet.totalTransactions ?? 0).toLocaleString() : '0', icon: 'sync' },
  ];

  const visibleTiles = CONSOLE_TILES.filter((tile) => hasPermission(TILE_PERMISSIONS[tile.key] || tile.key));
  const canSeeAlerts = hasPermission('inventory');
  const canAdjustWallet = hasPermission('wallet_adjust');

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Staff console</h1>
        <p className="text-text-secondary text-xs mt-1">
          Monitor inventory, checkout analytics, sales balances, and exports.
        </p>
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="Revenue today" value={loading ? '—' : <Money amount={stats?.today?.revenue ?? 0} />} sub={`${stats?.today?.salesCount ?? 0} orders`} />
        <StatCard label="Profit today" value={loading ? '—' : <Money amount={stats?.today?.profit ?? 0} />} sub="calculated, before write-offs" valueColor="var(--color-ok)" />
        <StatCard label="Low stock" value={loading ? '—' : `${stats?.inventory?.lowStock ?? 0}`} sub={`${stats?.inventory?.outOfStock ?? 0} out of stock`} valueColor={stats?.inventory?.lowStock ? 'var(--color-warn)' : undefined} />
        <StatCard
          label="Unreconciled"
          value={loading ? '—' : `${stats?.wallet?.unreconciledLimboCount ?? 0}`}
          sub={stats?.wallet?.unreconciledLimboTotal ? <Money amount={stats.wallet.unreconciledLimboTotal} /> : 'cash orders in limbo'}
          valueColor={stats?.wallet?.unreconciledLimboCount ? 'var(--color-err)' : undefined}
        />
      </div>

      <div>
        <h2 className="text-[17px] font-bold tracking-tight mb-3">Console</h2>
        <ConsoleTileGrid tiles={visibleTiles} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MiniStatList title="Inventory levels" stats={inventoryStats} />
        <MiniStatList title="Customer activity" stats={customerStats} />
        <MiniStatList title="System wallets" stats={walletStats} />
      </div>

      {(canSeeAlerts || canAdjustWallet) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {canSeeAlerts && <LowStockAlertsCard alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />}
          {canAdjustWallet && (
            <WalletAdjustCard
              userId={walletUserId}
              onUserIdChange={setWalletUserId}
              amount={walletAmount}
              onAmountChange={setWalletAmount}
              description={walletDesc}
              onDescriptionChange={setWalletDesc}
              pin={walletPin}
              onPinChange={setWalletPin}
              loading={walletLoading}
              onSubmit={handleWalletAdjust}
            />
          )}
        </div>
      )}

      <AdminPinSetupModal
        isOpen={showAdminPinSetup}
        onDismiss={() => setShowAdminPinSetup(false)}
        onDone={() => setShowAdminPinSetup(false)}
      />
    </div>
  );
}
