import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { useCart } from '~/context/cart-context';
import { api } from '~/lib/api';
import { BalanceDisplay } from '~/components/ui/balance-display';
import { Card } from '~/components/ui/card';
import { Icon } from '~/components/ui/icon';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { ProductCard } from '~/components/ui/product-card';
import { FundWalletModal } from '~/components/modals/fund-wallet-modal';
import { PinSetupModal } from '~/components/modals/pin-setup-modal';

type Transaction = {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=200&h=200&fit=crop';

export function meta() {
  return [
    { title: "Dashboard - RAD5 Café" },
    { name: "description", content: "View your smart wallet balance and make instant orders." },
  ];
}

export default function Home() {
  const { user } = useAuth();
  const { cart, addToCart, removeFromCart, getItemQuantity, cartCount, cartTotal } = useCart();

  const [balance, setBalance] = useState(12500);
  const [walletId, setWalletId] = useState('RAD500000');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [pinSetupNeeded, setPinSetupNeeded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(false);

  // Modals Visibility States
  const [showFund, setShowFund] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  const fetchWalletDetails = () => {
    if (!user) return;
    setLoadingBalance(true);
    api.wallet.balance().then((res) => {
      if (res.success && res.data) {
        setBalance(res.data.balance);
        setWalletId(res.data.walletId);
      }
    }).catch(() => {}).finally(() => setLoadingBalance(false));
  };

  const fetchTransactions = () => {
    if (!user) return;
    setLoadingTx(true);
    api.wallet.transactions({ limit: 5 }).then((res: any) => {
      if (res.success && Array.isArray(res.data)) {
        setTransactions(res.data);
      } else {
        setTransactions([]);
      }
    }).catch(() => setTransactions([])).finally(() => setLoadingTx(false));
  };

  const fetchPopularItems = () => {
    setLoadingPopular(true);
    api.products.list({ limit: 4 })
      .then((res: any) => {
        const prodArray = res.products || res.data;
        if (res.success && Array.isArray(prodArray)) {
          const items = prodArray.slice(0, 4).map((item: any) => ({
            id: item._id || item.id,
            name: item.name,
            category: item.category || 'Others',
            price: item.sellingPrice ?? item.price ?? 0,
            image: item.imageUrl || DEFAULT_IMAGE,
            inStock: (item.quantity ?? item.currentStock ?? item.stock ?? 0) > 0,
          }));
          setPopularItems(items);
        } else {
          setPopularItems([]);
        }
      })
      .catch(() => setPopularItems([]))
      .finally(() => setLoadingPopular(false));
  };

  useEffect(() => {
    if (user) {
      fetchWalletDetails();
      fetchTransactions();
      fetchPopularItems();

      // Check user details for admin role and transaction PIN setup
      api.auth.me().then((res: any) => {
        if (res.success && res.data) {
          if (res.data.role === 'admin' || user.email === 'admin@rad5.cafe' || res.data.email === 'admin@rad5.cafe') {
            setIsAdmin(true);
          }
          if (!res.data.pinSetup) {
            setPinSetupNeeded(true);
            setShowPinSetup(true);
          }
        }
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handleOrderPlaced = () => {
      fetchWalletDetails();
      fetchTransactions();
      fetchPopularItems();
    };
    window.addEventListener('order-placed', handleOrderPlaced);
    return () => window.removeEventListener('order-placed', handleOrderPlaced);
  }, [user]);

  const handleFundSuccess = (amount: number) => {
    fetchWalletDetails();
    fetchTransactions();
  };

  const formatTxDate = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString();
    if (isToday) return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    if (isYesterday) return `Yesterday`;
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner section */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight" style={{ fontFamily: 'var(--font-rounded)' }}>
            Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-text-secondary text-sm">
            Access your food allowance wallet and place orders on the fly.
          </p>
        </div>
        {isAdmin && (
          <Link to="/admin" className="hidden md:inline-block">
            <Button variant="secondary" size="md" className="flex items-center gap-2 cursor-pointer shadow-md">
              <Icon name="chart-bar" size={16} />
              <span>Go to Admin Panel</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Main Balance Display */}
      {loadingBalance ? (
        <div className="shimmer h-[200px] w-full rounded-2xl" />
      ) : (
        <BalanceDisplay
          label="Available Wallet Balance"
          amount={balance}
          subtitle={`Wallet ID: ${walletId}`}
          actions={[
            {
              icon: 'bank',
              label: 'Fund Wallet',
              onPress: () => setShowFund(true),
            },
            {
              icon: 'sync',
              label: 'Refresh Balance',
              onPress: fetchWalletDetails,
            },
          ]}
        />
      )}

      {/* Grid of menu previews */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-main">Popular Items</h2>
          <Link to="/cafe" className="text-xs font-bold text-tint hover:underline">
            View Menu Catalog →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingPopular ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="shimmer h-44 rounded-xl" />
            ))
          ) : popularItems.length > 0 ? (
            popularItems.map((item) => (
              <div key={item.id} className="h-44">
                <ProductCard
                  item={item}
                  quantity={getItemQuantity(item.id)}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-text-secondary text-sm">
              No products available yet. <Link to="/cafe" className="text-tint font-bold hover:underline">Browse the catalog</Link>
            </div>
          )}
        </div>
      </div>

      {/* Transactions and quick information */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-main">Recent Activity</h2>
          <Link to="/history" className="text-xs font-bold text-tint hover:underline">
            See All →
          </Link>
        </div>

        <Card padded={false} className="overflow-hidden">
          {loadingTx ? (
            <div className="flex justify-center items-center py-10">
              <svg className="animate-spin h-6 w-6 text-tint" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const isDebit = tx.amount < 0;
                const isFailed = tx.status === 'failed';
                return (
                  <div key={tx._id} className="flex justify-between items-center p-4 hover:bg-bg-selected/35 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          isFailed
                            ? 'bg-error-val/10 text-error-val'
                            : isDebit
                            ? 'bg-accent/10 text-accent'
                            : 'bg-success/10 text-success'
                        }`}
                      >
                        <Icon
                          name={isFailed ? 'x' : isDebit ? 'arrow-up' : 'arrow-down'}
                          size={16}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-text-main">{tx.type}</span>
                        <span className="text-xs text-text-secondary">{formatTxDate(tx.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`font-bold text-sm select-all ${
                          isFailed ? 'text-error-val line-through' : isDebit ? 'text-accent' : 'text-success'
                        }`}
                      >
                        {isDebit ? '-' : '+'}₦{Math.abs(tx.amount).toLocaleString()}
                      </span>
                      {isFailed && <Badge label="Failed" variant="error" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Modals Mounting */}
      <FundWalletModal
        isOpen={showFund}
        onClose={() => setShowFund(false)}
        userEmail={user?.email || ''}
        onSuccess={handleFundSuccess}
      />

      <PinSetupModal
        isOpen={showPinSetup}
        onDismiss={() => setShowPinSetup(false)}
        onDone={() => {
          setShowPinSetup(false);
          setPinSetupNeeded(false);
        }}
      />
    </div>
  );
}
