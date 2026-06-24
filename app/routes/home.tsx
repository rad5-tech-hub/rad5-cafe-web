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
import { TransferWalletModal } from '~/components/modals/transfer-wallet-modal';

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
  const [showTransfer, setShowTransfer] = useState(false);
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
      const rawList = res.transactions || res.data;
      if (res.success && Array.isArray(rawList)) {
        const parseDate = (val: any): string => {
          if (!val) return new Date().toISOString();
          if (typeof val === 'string') return val;
          if (typeof val === 'number') return new Date(val).toISOString();
          if (typeof val === 'object') {
            if (typeof val.toDate === 'function') return val.toDate().toISOString();
            if (typeof val._seconds === 'number') return new Date(val._seconds * 1000).toISOString();
            if (typeof val.seconds === 'number') return new Date(val.seconds * 1000).toISOString();
          }
          return new Date(val).toISOString();
        };
        const normalized = rawList.map((tx: any) => ({
          ...tx,
          _id: tx.id ?? tx._id,
          createdAt: parseDate(tx.createdAt),
        }));
        setTransactions(normalized);
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

  const handleFundSuccess = (amount?: number) => {
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
    <div className="flex flex-col xl:flex-row gap-8 w-full">
      {/* Left Column (Main) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header matching Logip */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-main" style={{ fontFamily: 'var(--font-sans)' }}>
              Hello, {user?.displayName || user?.email?.split('@')[0] || 'Margaret'}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Track team progress here. You almost reach a goal!
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
             <span className="text-sm font-semibold text-text-secondary">
               {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
             </span>
             <button className="w-10 h-10 rounded-xl bg-bg-element border border-border flex items-center justify-center shadow-sm hover:bg-bg-selected transition-colors cursor-pointer">
               <Icon name="calendar" size={18} className="text-text-main" />
             </button>
          </div>
        </div>

        <BalanceDisplay
          label="Available Balance"
          amount={balance}
          subtitle={`Wallet ID: ${walletId}`}
          actions={[
            {
              icon: 'plus',
              label: 'Fund Wallet',
              onPress: () => setShowFund(true),
            },
            {
              icon: 'arrow-up',
              label: 'Transfer',
              onPress: () => setShowTransfer(true),
            },
          ]}
        />

        {/* Popular Items Area (Where Chart would be in Logip) */}
        <div className="mb-8">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-text-main">Menu Highlights</h2>
             <Link to="/cafe" className="flex items-center gap-2 bg-bg-element border border-border px-3 py-1.5 rounded-lg shadow-sm hover:bg-bg-selected transition-colors cursor-pointer text-xs font-semibold text-text-main">
               <span>View All</span>
               <Icon name="chevron-right" size={14} />
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
                <div className="col-span-full text-center py-10 text-text-secondary text-sm bg-bg-element rounded-xl border border-border border-dashed">
                  No products available yet.
                </div>
              )}
           </div>
        </div>

        {/* Recent Activity (Where Current Tasks is in Logip) */}
        <div>
           <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-text-main">Recent Transactions</h2>
             </div>
             <div className="flex items-center gap-2 bg-bg-element border border-border px-3 py-1.5 rounded-lg shadow-sm hover:bg-bg-selected transition-colors cursor-pointer text-xs font-semibold text-text-main">
               <span>Week</span>
               <Icon name="arrow-down" size={14} />
             </div>
           </div>

           <Card padded={false} className="divide-y divide-border shadow-sm">
              {loadingTx ? (
                <div className="flex justify-center items-center py-10">
                  <Icon name="sync" size={24} className="animate-spin text-tint" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-sm">
                  No transactions recorded yet.
                </div>
              ) : (
                transactions.map((tx) => {
                  const isDebit = tx.amount < 0;
                  const isFailed = tx.status === 'failed';
                  return (
                    <div key={tx._id} className="flex justify-between items-center p-5 hover:bg-bg-selected/30 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                            isFailed
                              ? 'bg-error-val/10 text-error-val'
                              : isDebit
                              ? 'bg-accent/10 text-accent'
                              : 'bg-success/10 text-success'
                          }`}
                        >
                          <Icon
                            name={isFailed ? 'x' : isDebit ? 'arrow-up' : 'arrow-down'}
                            size={18}
                          />
                        </div>
                        <div className="flex items-center gap-4 md:gap-8 flex-1">
                           <span className="font-semibold text-sm text-text-main w-1/3">{tx.type}</span>
                           <div className="flex items-center gap-2 w-1/4 hidden md:flex">
                             <div className={`w-2 h-2 rounded-full ${isFailed ? 'bg-error-val' : isDebit ? 'bg-accent' : 'bg-success'}`}></div>
                             <span className="text-xs font-semibold text-text-main capitalize">{tx.status}</span>
                           </div>
                           <div className="flex items-center gap-2 hidden md:flex text-text-secondary text-xs font-semibold w-1/4">
                             <Icon name="sync" size={12} />
                             <span>{formatTxDate(tx.createdAt)}</span>
                           </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`font-bold text-sm select-all ${
                            isFailed ? 'text-text-secondary line-through' : isDebit ? 'text-text-main' : 'text-success'
                          }`}
                        >
                          {isDebit ? '-' : '+'}₦{Math.abs(tx.amount).toLocaleString()}
                        </span>
                        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-bg-element text-text-secondary transition-colors cursor-pointer">
                           <Icon name="more-vertical" size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
           </Card>
        </div>
      </div>



      {/* Modals Mounting */}
      <FundWalletModal
        isOpen={showFund}
        onClose={() => setShowFund(false)}
        userEmail={user?.email || ''}
        onSuccess={handleFundSuccess}
      />

      <TransferWalletModal
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        onSuccess={handleFundSuccess}
        onPinNotSet={() => {
          setPinSetupNeeded(true);
          setShowPinSetup(true);
        }}
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
