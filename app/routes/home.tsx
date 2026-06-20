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

        {/* Unified Stats Card matching Logip */}
        <Card padded={false} className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border mb-8 shadow-sm">
          <div className="flex-1 p-6 flex flex-row items-center gap-4 group hover:bg-bg-selected/30 transition-colors cursor-default">
            <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 flex-shrink-0">
              <Icon name="dollar" size={22} />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-xs font-semibold text-text-secondary select-all">Available Balance</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-bold text-text-main tabular-nums select-all">₦{balance.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-success flex items-center bg-success/10 px-1.5 py-0.5 rounded-md">
                   + Active
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6 flex flex-row items-center gap-4 group hover:bg-bg-selected/30 transition-colors cursor-default">
            <div className="w-12 h-12 rounded-full bg-tint/15 text-tint flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 flex-shrink-0">
              <Icon name="bank" size={22} />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-xs font-semibold text-text-secondary select-all">Wallet ID</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-bold text-text-main tabular-nums select-all">{walletId}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 flex flex-row items-center gap-4 group hover:bg-bg-selected/30 transition-colors cursor-pointer" onClick={() => setShowFund(true)}>
            <div className="w-12 h-12 rounded-full bg-accent/15 text-accent flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 flex-shrink-0">
              <Icon name="plus" size={22} />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-xs font-semibold text-text-secondary select-all">Quick Action</span>
              <span className="text-xl font-bold text-text-main tabular-nums select-all mt-0.5">Fund Wallet</span>
            </div>
          </div>
        </Card>

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

      {/* Right Column (Profile & Activity Feed) */}
      <div className="w-full xl:w-[320px] flex flex-col gap-8">
        {/* Profile Box matching Logip */}
        <Card className="flex flex-col items-center text-center p-8 bg-[#F8FAFC] dark:bg-bg-selected/30 border-none rounded-[24px]">
          <div className="w-24 h-24 rounded-full bg-tint/10 flex items-center justify-center mb-4 relative shadow-sm border-[3px] border-white">
             <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full rounded-full object-cover" />
             <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-error-val border-2 border-white"></div>
          </div>
          <h3 className="text-base font-bold text-text-main">{user?.displayName || 'Megan Norton'}</h3>
          <span className="text-xs font-semibold text-text-secondary mb-6">@{user?.email?.split('@')[0] || 'megnorton'}</span>
          
          <div className="flex items-center gap-3">
             <button className="w-10 h-10 rounded-full bg-white dark:bg-bg-element border border-border flex items-center justify-center hover:bg-bg-selected transition-colors shadow-sm cursor-pointer group">
                <Icon name="phone" size={16} className="text-text-main group-hover:scale-110 transition-transform" />
             </button>
             <button className="w-10 h-10 rounded-full bg-white dark:bg-bg-element border border-border flex items-center justify-center hover:bg-bg-selected transition-colors shadow-sm cursor-pointer group">
                <Icon name="mail" size={16} className="text-text-main group-hover:scale-110 transition-transform" />
             </button>
             <button className="w-10 h-10 rounded-full bg-white dark:bg-bg-element border border-border flex items-center justify-center hover:bg-bg-selected transition-colors shadow-sm cursor-pointer group">
                <Icon name="more-vertical" size={16} className="text-text-main group-hover:scale-110 transition-transform" />
             </button>
          </div>
        </Card>

        {/* Activity Feed matching Logip */}
        <div className="flex flex-col flex-1">
          <div className="flex justify-center mb-6">
             <h2 className="text-sm font-semibold text-text-main">Activity</h2>
          </div>
          
          <div className="flex flex-col gap-6 relative">
            <div className="absolute left-4 top-2 bottom-0 w-px bg-border -z-10"></div>
            
             <div className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full border border-border bg-white overflow-hidden flex-shrink-0 mt-0.5">
                   <img src="https://i.pravatar.cc/150?u=1" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex flex-col min-w-0">
                   <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-text-main">Floyd Miles</span>
                      <span className="text-[10px] font-semibold text-text-secondary whitespace-nowrap pt-0.5">10:15 AM</span>
                   </div>
                   <span className="text-xs text-text-secondary mt-0.5">Commented on <span className="text-tint cursor-pointer hover:underline">Stark Project</span></span>
                   
                   <div className="mt-3 bg-tint/5 p-3 rounded-xl rounded-tl-none border border-tint/10 relative">
                     <p className="text-xs text-text-main leading-relaxed font-medium">Hi! Next week we'll start a new project. I'll tell you all the details later</p>
                     <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-border text-[10px]">👍</div>
                   </div>
                </div>
             </div>

             <div className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full border border-border bg-white overflow-hidden flex-shrink-0 mt-0.5 relative">
                   <img src="https://i.pravatar.cc/150?u=2" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                   <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white"></div>
                </div>
                <div className="flex flex-col min-w-0 w-full">
                   <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-text-main">Guy Hawkins</span>
                      <span className="text-[10px] font-semibold text-text-secondary whitespace-nowrap pt-0.5">10:15 AM</span>
                   </div>
                   <span className="text-xs text-text-secondary mt-0.5">Added a file to <span className="text-tint cursor-pointer hover:underline">7Heros Project</span></span>
                   
                   <div className="mt-3 bg-bg-element border border-border p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-bg-selected transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-md bg-text-main text-white flex items-center justify-center">
                            <span className="text-[10px] font-bold">F</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-main">Homepage.fig</span>
                            <span className="text-[10px] font-semibold text-text-secondary">13.4 Mb</span>
                         </div>
                      </div>
                      <Icon name="arrow-down" size={14} className="text-tint" />
                   </div>
                </div>
             </div>

             <div className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full border border-border bg-white overflow-hidden flex-shrink-0 mt-0.5">
                   <img src="https://i.pravatar.cc/150?u=3" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex flex-col min-w-0">
                   <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-text-main">Kristin Watson</span>
                      <span className="text-[10px] font-semibold text-text-secondary whitespace-nowrap pt-0.5">10:15 AM</span>
                   </div>
                   <span className="text-xs text-text-secondary mt-0.5">Commented on <span className="text-tint cursor-pointer hover:underline">7Heros Project</span></span>
                </div>
             </div>

          </div>

          <div className="mt-auto pt-6">
             <div className="bg-bg-element border border-border rounded-2xl p-2 flex items-center gap-2 shadow-sm focus-within:border-tint transition-colors">
                <button className="p-2 text-text-secondary hover:text-text-main transition-colors cursor-pointer">
                  <Icon name="plus" size={16} />
                </button>
                <input type="text" placeholder="Write a message" className="bg-transparent flex-1 text-sm outline-none text-text-main font-medium placeholder:font-normal placeholder:text-text-secondary" />
                <button className="p-2 text-text-secondary hover:text-text-main transition-colors cursor-pointer">
                  <Icon name="user" size={16} />
                </button>
                <button className="p-2 text-text-secondary hover:text-text-main transition-colors cursor-pointer">
                  <Icon name="smartphone" size={16} />
                </button>
             </div>
          </div>
        </div>
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
