import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '~/lib/firebase';
import { api } from '~/lib/api';
import { Money } from '~/components/ui/money';
import { StatCard } from '~/components/ui/stat-card';
import { Icon } from '~/components/ui/icon';
import { GlassPanel } from '~/components/ui/glass-panel';
import { ConsoleTileGrid, type ConsoleTile } from '~/components/admin/console-tile-grid';
import { MiniStatList, type MiniStat } from '~/components/admin/mini-stat-list';
import { LowStockAlertsCard } from '~/components/admin/low-stock-alerts-card';
import { WalletAdjustCard } from '~/components/admin/wallet-adjust-card';
import { RecentActivity, type RecentTxn } from '~/components/dashboard/recent-activity';
import { useToast } from '~/context/toast-context';
import { AdminPinSetupModal } from '~/components/modals/admin-pin-setup-modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';

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

const tooltipStyle = { backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: 12 };
const axisTick = { fontSize: 11, fill: 'var(--color-text-secondary)' };

function Spinner({ size = 16 }: { size?: number }) {
  return <Icon name="sync" size={size} className="animate-spin text-tint" />;
}

export default function Admin() {
  const { showToast } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<RecentTxn[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [trend, setTrend] = useState<{ date: string; revenue: number }[]>([]);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [paystackTotal, setPaystackTotal] = useState<{ total: number; count: number } | null>(null);
  const [loadingPaystackTotal, setLoadingPaystackTotal] = useState(true);
  const [accountingTotals, setAccountingTotals] = useState<{ actualizedRevenue: number; actualizedProfit: number; limboAmount: number } | null>(null);
  const [loadingAccounting, setLoadingAccounting] = useState(true);

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
      })
      .finally(() => setLoading(false));

    api.adminDashboard.alerts.list()
      .then((res: any) => {
        const list = res.data ?? res;
        if (res.success && Array.isArray(list)) setAlerts(list);
      })
      .catch((err: any) => {
        console.warn('Could not load alerts:', err);
      });

    setLoadingTrend(true);
    api.adminDashboard.analytics.weekly(7)
      .then((res: any) => {
        const data = res.data ?? res;
        if (res.success && data?.trend?.revenueByDay) setTrend(data.trend.revenueByDay);
      })
      .catch((err: any) => {
        console.warn('Could not load revenue trend:', err);
      })
      .finally(() => setLoadingTrend(false));

    // Walks Paystack's own transaction history and sums it — this is the
    // real, live total that has ever moved through the account, used in
    // place of Paystack's /balance figure (which reflects the *current
    // settlement-account* balance, not the total collected — those are
    // different numbers, and the latter is what matters for "how much has
    // this account processed, all-time").
    setLoadingPaystackTotal(true);
    api.adminDashboard.paystack.total()
      .then((res: any) => {
        const data = res.data ?? res;
        if (res.success && data) setPaystackTotal(data);
      })
      .catch((err: any) => {
        console.warn('Could not load Paystack transaction total:', err);
      })
      .finally(() => setLoadingPaystackTotal(false));

    // All-time "actualized" revenue/profit — realized from completed orders
    // across the whole history, not just today. Scans every order, so kept
    // as its own decoupled fetch rather than folded into /overview.
    setLoadingAccounting(true);
    api.adminDashboard.analytics.accounting()
      .then((res: any) => {
        const data = res.data ?? res;
        if (res.success && data?.totals) setAccountingTotals(data.totals);
      })
      .catch((err: any) => {
        console.warn('Could not load accounting totals:', err);
      })
      .finally(() => setLoadingAccounting(false));

    setLoadingActivity(true);
    api.adminDashboard.recentActivity(20)
      .then((res: any) => {
        const list = res.data ?? res;
        if (res.success && Array.isArray(list)) setActivity(list);
      })
      .catch((err: any) => {
        console.warn('Could not load recent activity:', err);
      })
      .finally(() => setLoadingActivity(false));
  };

  const formatWhen = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString();
    if (isToday) return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    if (isYesterday) return 'Yesterday';
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
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
      let sawNewOrder = false;
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          sawNewOrder = true;
          const order = change.doc.data() as any;
          if ('Notification' in window && Notification.permission === 'granted') {
            const itemsStr = order.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ');
            const body = `Customer: ${order.customerName || 'Unknown'}\nProducts: ${itemsStr}`;
            new Notification('New Order Placed!', { body });
          }
        }
      });
      if (sawNewOrder) fetchAdminData();
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

  // ── Inventory health donut ──────────────────────────────────────
  const totalProducts = stats?.inventory?.totalProducts ?? 0;
  const lowStockCount = stats?.inventory?.lowStock ?? 0;
  const outOfStockCount = stats?.inventory?.outOfStock ?? 0;
  const healthyStockCount = Math.max(0, totalProducts - lowStockCount - outOfStockCount);
  const inventoryBreakdown = [
    { name: 'Healthy stock', value: healthyStockCount, color: 'var(--color-ok)' },
    { name: 'Low stock', value: lowStockCount, color: 'var(--color-warn)' },
    { name: 'Out of stock', value: outOfStockCount, color: 'var(--color-err)' },
  ];
  const pct = (n: number) => (totalProducts > 0 ? Math.round((n / totalProducts) * 100) : 0);

  // ── Payment reconciliation gauge ────────────────────────────────
  const completedOnline = stats?.payments?.onlineTransactionsCount ?? 0;
  const stalePending = stats?.payments?.stalePendingPayments?.count ?? 0;
  const onlineAttempts = completedOnline + stalePending;
  const reconciliationRate = onlineAttempts > 0 ? Math.round((completedOnline / onlineAttempts) * 100) : 100;
  const reconciliationColor = reconciliationRate >= 95 ? 'var(--color-ok)' : reconciliationRate >= 80 ? 'var(--color-warn)' : 'var(--color-err)';

  const unreconciledCashCount = stats?.wallet?.unreconciledLimboCount ?? 0;
  const unreconciledCashTotal = stats?.wallet?.unreconciledLimboTotal ?? 0;

  const stillComputing = loading || loadingPaystackTotal || loadingTrend || loadingAccounting;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Staff console</h1>
          <p className="text-text-secondary text-xs mt-1">
            Monitor inventory, checkout analytics, sales balances, and exports.
          </p>
        </div>
        {stillComputing && (
          <span className="flex items-center gap-2 text-xs font-semibold text-text-secondary glass-chip px-3 py-1.5 rounded-full">
            <Spinner size={13} /> Crunching the numbers…
          </span>
        )}
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard
          label="All-time revenue"
          value={loadingAccounting ? <Spinner size={20} /> : <Money amount={accountingTotals?.actualizedRevenue ?? 0} />}
          sub="realized, across every order"
          valueColor="var(--color-ok)"
        />
        <StatCard
          label="All-time profit"
          value={loadingAccounting ? <Spinner size={20} /> : <Money amount={accountingTotals?.actualizedProfit ?? 0} />}
          sub="realized, across every order"
          valueColor="var(--color-ok)"
        />
        <StatCard
          label="Stock value (cost)"
          value={loading ? <Spinner size={20} /> : <Money amount={stats?.inventory?.costValue ?? 0} />}
          sub={`${Number(stats?.inventory?.totalUnits ?? 0).toLocaleString()} units on hand`}
        />
        <StatCard
          label="Stock value (retail)"
          value={loading ? <Spinner size={20} /> : <Money amount={stats?.inventory?.retailValue ?? 0} />}
          sub="if sold at listed prices"
        />
      </div>

      {/* Hero: revenue trend + Paystack/payments panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-stretch">
        <GlassPanel radius="lg" className="flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[12.5px] font-semibold text-text-secondary">Revenue today</span>
              <div className="font-money text-[28px] font-extrabold tracking-tight mt-1 h-[34px] flex items-center">
                {loading ? <Spinner size={22} /> : <Money amount={stats?.today?.revenue ?? 0} />}
              </div>
              <span className="text-xs text-text-secondary">
                {stats?.today?.salesCount ?? 0} orders · profit{' '}
                <span className="text-ok font-semibold"><Money amount={stats?.today?.profit ?? 0} /></span>
              </span>
            </div>
            <span className="text-[10.5px] font-bold text-text-secondary uppercase tracking-wider px-2.5 py-1 rounded-full glass-chip whitespace-nowrap">
              Last 7 days
            </span>
          </div>
          <div className="h-56 mt-4 -ml-2">
            {loadingTrend && trend.length === 0 ? (
              <div className="h-full flex items-center justify-center gap-2 text-xs text-text-secondary">
                <Spinner size={16} /> Loading revenue trend…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-NG', { weekday: 'short' })} tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} tick={axisTick} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    formatter={(val: any) => [`₦${Number(val).toLocaleString()}`, 'Revenue']}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="revenue" fill="var(--color-tint)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassPanel>

        <GlassPanel radius="lg" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-text-secondary">Paystack</span>
            <span className="w-7 h-7 rounded-lg bg-tint-b text-tint grid place-items-center flex-shrink-0">
              <Icon name="bank" size={14} />
            </span>
          </div>
          <div>
            <div className="font-money text-[26px] font-extrabold tracking-tight h-[32px] flex items-center">
              {loadingPaystackTotal ? <Spinner size={20} /> : paystackTotal ? <Money amount={paystackTotal.total} /> : 'unavailable'}
            </div>
            <span className="text-xs text-text-secondary">
              {loadingPaystackTotal
                ? "walking Paystack's transaction history — can take a few seconds…"
                : paystackTotal
                ? `sum of ${paystackTotal.count.toLocaleString()} successful transactions, all-time`
                : 'sum of all transactions, from Paystack'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-border/60">
            <div>
              <span className="block text-text-secondary mb-0.5">Recorded in our system</span>
              <span className="font-bold">{stats?.payments ? `₦${Number(stats.payments.onlineTransactionsTotal ?? 0).toLocaleString()}` : '₦0'}</span>
            </div>
            <div>
              <span className="block text-text-secondary mb-0.5">Wallet escrow</span>
              <span className="font-bold">{stats?.wallet ? `₦${Number(stats.wallet.totalValue ?? 0).toLocaleString()}` : '₦0'}</span>
            </div>
          </div>
        </GlassPanel>
      </div>

      <div>
        <h2 className="text-[17px] font-bold tracking-tight mb-3">Console</h2>
        <ConsoleTileGrid tiles={visibleTiles} />
      </div>

      {/* Cost analysis / financial health / goal tracker equivalent row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassPanel radius="lg">
          <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Inventory health</h3>
          <div className="flex items-center gap-5">
            <div className="w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={inventoryBreakdown} dataKey="value" innerRadius={32} outerRadius={54} stroke="none">
                    {inventoryBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2.5 text-xs flex-1 min-w-0">
              {inventoryBreakdown.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                    <span className="truncate font-semibold">{entry.name}</span>
                  </span>
                  <span className="font-bold flex-shrink-0">{entry.value} · {pct(entry.value)}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel radius="lg" className="flex flex-col items-center text-center">
          <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4 self-start">Payment reconciliation</h3>
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={[{ value: reconciliationRate }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={8} fill={reconciliationColor} background={{ fill: 'var(--ink-a)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-2xl font-extrabold" style={{ color: reconciliationColor }}>{reconciliationRate}%</span>
            </div>
          </div>
          <span className="text-xs text-text-secondary mt-3">
            {onlineAttempts > 0
              ? `Based on ${onlineAttempts} online payment attempts`
              : 'No online payments recorded yet'}
          </span>
          {stalePending > 0 && (
            <span className="text-[11px] font-bold text-warn mt-1">{stalePending} stuck — money may be uncredited</span>
          )}
        </GlassPanel>

        <GlassPanel radius="lg">
          <h3 className="font-bold text-text-secondary uppercase text-xs tracking-wider mb-4">Needs attention</h3>
          <div className="flex flex-col gap-3.5">
            <Link to="/inventory" className="flex items-center justify-between gap-3 group">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0" style={{ background: lowStockCount ? 'rgba(245,158,11,0.14)' : 'var(--ink-a)', color: lowStockCount ? 'var(--color-warn)' : 'var(--color-text-secondary)' }}>
                  <Icon name="alert-triangle" size={14} />
                </span>
                <span className="text-sm font-semibold truncate group-hover:text-tint transition-colors">Low stock alerts</span>
              </span>
              <span className="text-sm font-extrabold flex-shrink-0">{lowStockCount}</span>
            </Link>
            <Link to="/accounting" className="flex items-center justify-between gap-3 group">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0" style={{ background: stalePending ? 'rgba(245,158,11,0.14)' : 'var(--ink-a)', color: stalePending ? 'var(--color-warn)' : 'var(--color-text-secondary)' }}>
                  <Icon name="bank" size={14} />
                </span>
                <span className="text-sm font-semibold truncate group-hover:text-tint transition-colors">Stuck online payments</span>
              </span>
              <span className="text-sm font-extrabold flex-shrink-0">{stalePending}</span>
            </Link>
            <Link to="/admin/cash-orders" className="flex items-center justify-between gap-3 group">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0" style={{ background: unreconciledCashCount ? 'rgba(239,68,68,0.12)' : 'var(--ink-a)', color: unreconciledCashCount ? 'var(--color-err)' : 'var(--color-text-secondary)' }}>
                  <Icon name="cash" size={14} />
                </span>
                <span className="text-sm font-semibold truncate group-hover:text-tint transition-colors">Unreconciled cash orders</span>
              </span>
              <span className="text-sm font-extrabold flex-shrink-0">{unreconciledCashCount}</span>
            </Link>
            {unreconciledCashCount > 0 && (
              <span className="text-[11px] text-text-secondary -mt-2 ml-[42px]"><Money amount={unreconciledCashTotal} /> in limbo</span>
            )}
          </div>
        </GlassPanel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <div>
        <h2 className="text-[17px] font-bold tracking-tight mb-3">Recent activity</h2>
        <RecentActivity transactions={activity} loading={loadingActivity} formatWhen={formatWhen} />
      </div>

      <AdminPinSetupModal
        isOpen={showAdminPinSetup}
        onDismiss={() => setShowAdminPinSetup(false)}
        onDone={() => setShowAdminPinSetup(false)}
      />
    </div>
  );
}
