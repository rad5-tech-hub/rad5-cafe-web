import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { useCart } from '~/context/cart-context';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';
import { ProductGalleryModal } from '~/components/ui/product-gallery-modal';
import { FundWalletModal } from '~/components/modals/fund-wallet-modal';
import { PinSetupModal } from '~/components/modals/pin-setup-modal';
import { TransferWalletModal } from '~/components/modals/transfer-wallet-modal';
import { DashboardHero } from '~/components/dashboard/dashboard-hero';
import { SpendChartCard } from '~/components/dashboard/spend-chart-card';
import { FrequentItems, type FrequentItem } from '~/components/dashboard/frequent-items';
import { RecentActivity, type RecentTxn } from '~/components/dashboard/recent-activity';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=200&h=200&fit=crop';
const SPEND_BUCKET_DAYS = 12;

export function meta() {
  return [
    { title: "Dashboard - RAD5 Café" },
    { name: "description", content: "View your smart wallet balance and make instant orders." },
  ];
}

function parseDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return new Date(val).toISOString();
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val._seconds === 'number') return new Date(val._seconds * 1000).toISOString();
    if (typeof val.seconds === 'number') return new Date(val.seconds * 1000).toISOString();
  }
  return new Date(val).toISOString();
}

export default function Home() {
  const { user } = useAuth();
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [walletId, setWalletId] = useState('RAD500000');
  const [transactions, setTransactions] = useState<RecentTxn[]>([]);
  const [spendTxns, setSpendTxns] = useState<RecentTxn[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [popularItems, setPopularItems] = useState<FrequentItem[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [masked, setMasked] = useState(false);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

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
        setTransactions(rawList.map((tx: any) => ({ ...tx, id: tx.id ?? tx._id, createdAt: parseDate(tx.createdAt) })));
      } else {
        setTransactions([]);
      }
    }).catch(() => setTransactions([])).finally(() => setLoadingTx(false));
  };

  // A larger window of recent transactions purely to derive the "spent this
  // month" sparkline from real debit history (no fabricated numbers).
  const fetchSpendHistory = () => {
    if (!user) return;
    api.wallet.transactions({ limit: 60 }).then((res: any) => {
      const rawList = res.transactions || res.data;
      if (res.success && Array.isArray(rawList)) {
        setSpendTxns(rawList.map((tx: any) => ({ ...tx, id: tx.id ?? tx._id, createdAt: parseDate(tx.createdAt) })));
      }
    }).catch(() => {});
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

  const [pinSetupNeeded, setPinSetupNeeded] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletDetails();
      fetchTransactions();
      fetchSpendHistory();
      fetchPopularItems();

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
      fetchSpendHistory();
      fetchPopularItems();
    };
    window.addEventListener('order-placed', handleOrderPlaced);
    return () => window.removeEventListener('order-placed', handleOrderPlaced);
  }, [user]);

  const handleFundSuccess = () => {
    fetchWalletDetails();
    fetchTransactions();
    fetchSpendHistory();
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

  // Derive the trailing-12-day spend sparkline + calendar month-to-date total
  // from the user's own transaction history.
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const buckets = Array.from({ length: SPEND_BUCKET_DAYS }, () => 0);
  let monthTotal = 0;
  spendTxns.forEach((tx) => {
    if (tx.amount >= 0) return;
    const t = new Date(tx.createdAt).getTime();
    if (t >= startOfMonth) monthTotal += Math.abs(tx.amount);
    const diffDays = Math.floor((now.getTime() - t) / 86400000);
    if (diffDays >= 0 && diffDays < SPEND_BUCKET_DAYS) {
      buckets[SPEND_BUCKET_DAYS - 1 - diffDays] += Math.abs(tx.amount);
    }
  });
  const maxBucket = Math.max(1, ...buckets);
  const spendBars = buckets.map((v) => Math.round((v / maxBucket) * 100));

  return (
    <div className="flex flex-col min-w-0">
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4 items-start">
        <DashboardHero
          balance={balance}
          walletId={walletId}
          masked={masked}
          onToggleMask={() => setMasked((m) => !m)}
          onFund={() => setShowFund(true)}
          onTransfer={() => setShowTransfer(true)}
          onOrder={() => navigate('/cafe')}
          onCopyWalletId={() => {
            if (walletId && walletId !== 'RAD500000') {
              navigator.clipboard.writeText(walletId);
              showToast('Wallet ID copied to clipboard!', 'success');
            }
          }}
        />
        <div className="grid gap-3.5">
          <SpendChartCard total={monthTotal} bars={spendBars} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-[17px] font-bold tracking-tight">You order these often</h2>
        <Link to="/cafe" className="text-[13px] font-semibold text-tint hover:text-tint-dark">
          Full menu
        </Link>
      </div>
      <FrequentItems
        items={popularItems}
        loading={loadingPopular}
        getQuantity={getItemQuantity}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onOpen={(idx) => {
          setGalleryIndex(idx);
          setGalleryOpen(true);
        }}
      />

      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-[17px] font-bold tracking-tight">Recent activity</h2>
        <Link to="/history" className="text-[13px] font-semibold text-tint hover:text-tint-dark">
          Full ledger
        </Link>
      </div>
      <RecentActivity transactions={transactions} loading={loadingTx} formatWhen={formatTxDate} />

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

      <ProductGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        items={popularItems}
        initialIndex={galleryIndex}
        onAddToCart={addToCart}
      />
    </div>
  );
}
