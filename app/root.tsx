import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
  Link,
} from "react-router";
import React, { useEffect, useState } from "react";
import type { Route } from "./+types/root";
import "./app.css";

import { AuthProvider, useAuth } from './context/auth-context';
import { ToastProvider, useToast } from './context/toast-context';
import { NotificationProvider, useNotifications } from './context/notification-context';
import { CartProvider, useCart } from './context/cart-context';
import { ConfirmProvider, useConfirm } from './context/confirm-context';
import { Icon } from './components/ui/icon';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { CartModal } from './components/modals/cart-modal';
import { FullNameModal } from './components/modals/fullname-modal';
import { api } from './lib/api';

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Spline+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap",
  },
  { rel: "icon", href: "/RAD5 Cafe.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/RAD5 Cafe.svg" },
  { rel: "canonical", href: "https://cafe.rad5.com.ng" },
];

export const meta: Route.MetaFunction = () => [
  { charSet: "utf-8" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
  { name: "theme-color", content: "#003D99" },
  { name: "description", content: "RAD5 Café — Smart wallet, instant ordering, and real-time inventory. Download the Android app or order online with Google sign-in." },
  { name: "keywords", content: "RAD5 Café, smart wallet, café ordering, food delivery, inventory management, POS system" },
  { name: "author", content: "RAD5 Tech Hub" },
  { name: "robots", content: "index, follow" },
  { property: "og:title", content: "RAD5 Café — Smart Wallet & Ordering" },
  { property: "og:description", content: "Download the app or order online. Smart wallet, instant checkout, real-time inventory." },
  { property: "og:type", content: "website" },
  { property: "og:url", content: "https://cafe.rad5.com.ng" },
  { property: "og:image", content: "https://images.pexels.com/photos/34932768/pexels-photo-34932768.jpeg" },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: "RAD5 Café — Smart Wallet & Ordering" },
  { name: "twitter:description", content: "Download the app or order online. Smart wallet, instant checkout, real-time inventory." },
  { name: "twitter:image", content: "https://images.pexels.com/photos/34932768/pexels-photo-34932768.jpeg" },
];

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { showConfirm } = useConfirm();
  const { showToast } = useToast();
  const { cartCount, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const { registerWebPush, permissionStatus } = useNotifications();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [appUpdateInfo, setAppUpdateInfo] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showFullNameModal, setShowFullNameModal] = useState(false);

  const isAuthRoute = ['/', '/login', '/register', '/setup-pin'].includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/admin') || 
                       ['/inventory', '/analytics', '/sales', '/reports', '/accounting'].includes(location.pathname);

  // Check user profile for admin role
  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      api.auth.me().then((res) => {
        if (res.success && res.data) {
          setProfile(res.data);
          if (res.data.role === 'admin' || user.email === 'admin@rad5.cafe' || res.data.email === 'admin@rad5.cafe') {
            setIsAdmin(true);
          }
        }
      }).catch(() => {})
        .finally(() => setProfileLoading(false));

      api.auth.hasFullName().then((res) => {
        const hasFullName = res.hasFullName !== undefined ? res.hasFullName : res.data?.hasFullName;
        if (res.success && hasFullName === false) {
          setShowFullNameModal(true);
        }
      }).catch(() => {});
    } else {
      setIsAdmin(false);
      setProfile(null);
      setProfileLoading(false);
      setShowFullNameModal(false);
    }
  }, [user]);

  // Check version updates for banner visibility
  useEffect(() => {
    if (user) {
      api.version.check('android')
        .then((res) => {
          if (res.success && res.data) {
            const { updatedAt, apkLink } = res.data;
            if (updatedAt && apkLink) {
              const releaseDate = new Date(updatedAt);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - releaseDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 10) {
                const isClosed = localStorage.getItem(`closed_banner_${res.data.version || 'unknown'}`);
                if (!isClosed) {
                  setAppUpdateInfo(res.data);
                  setShowBanner(true);
                }
              }
            }
          }
        })
        .catch((err) => console.warn('Failed to fetch update info for banner:', err));
    }
  }, [user]);

  // Register for web push notifications when user is authenticated
  useEffect(() => {
    if (user) {
      registerWebPush();
    }
  }, [user, registerWebPush]);

  const handleSignOut = async () => {
    const confirmed = await showConfirm({
      title: 'Sign Out Confirmation',
      message: 'Are you sure you want to sign out of your RAD5 Café account?',
      variant: 'danger',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await signOut();
      showToast('Signed out successfully.', 'success');
      navigate('/login');
    } catch (err) {
      showToast('Failed to sign out. Please try again.', 'error');
    }
  };

  const handleSwitchToPersonal = async () => {
    try {
      await signOut();
      showToast('Sign in with Google to access your personal account.', 'info');
      navigate('/login');
    } catch (err) {
      showToast('Failed to switch. Please try again.', 'error');
    }
  };

  const handleSwitchToAdmin = async () => {
    try {
      await signOut();
      showToast('Sign in with admin credentials to continue.', 'info');
      navigate('/login?redirect=/admin');
    } catch (err) {
      showToast('Failed to switch. Please try again.', 'error');
    }
  };

  // Auth & Admin Redirection Guard
  useEffect(() => {
    /*
    if (!loading && !profileLoading) {
      if (!user && !isAuthRoute) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      } else if (user && isAdminRoute && !isAdmin) {
        navigate('/dashboard');
      }
    }
    */
  }, [user, loading, profileLoading, isAuthRoute, isAdminRoute, isAdmin, navigate, location.pathname]);

  if (loading || (profileLoading && isAdminRoute)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-6 select-none animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-5">
          {/* Branded Logo Container */}
          <div className="relative flex items-center justify-center w-24 h-24 bg-gray-50/50 rounded-3xl border border-gray-100/70 shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-pulse-slow">
            <img src="/RAD5 Cafe.svg" alt="RAD5 Café" className="w-14 h-14" />
          </div>

          {/* Text & Elegant Progress Loader */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-extrabold tracking-widest text-[#003D99] uppercase font-sans">
              RAD5 Café
            </span>
            <div className="w-28 h-1 bg-[#003D99]/15 rounded-full overflow-hidden relative">
              <div className="loading-bar-active" style={{ backgroundColor: '#003D99' }} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">
              Loading your wallet & menu...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render Auth screens without global layout wrappers
  if (isAuthRoute) {
    return <>{children}</>;
  }

  const userNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'bank' as const },
    { label: 'Café Menu', path: '/cafe', icon: 'cart' as const },
    { label: 'Transactions', path: '/history', icon: 'sync' as const },
    { label: 'Notifications', path: '/notifications', icon: 'bell' as const },
    { label: 'My Profile', path: '/profile', icon: 'user' as const },
  ];

  const adminNavItems = [
    { label: 'Admin Panel', path: '/admin', icon: 'chart-bar' as const },
    { label: 'Inventory', path: '/inventory', icon: 'package-variant-closed' as const },
    { label: 'Analytics', path: '/analytics', icon: 'trending-up' as const },
    { label: 'Accounting', path: '/accounting', icon: 'cash' as const },
    { label: 'Sales Logs', path: '/sales', icon: 'dollar' as const },
    { label: 'Sales Ledger / Expenses', path: '/admin/expenses', icon: 'dollar' as const },
    { label: 'Cash Orders', path: '/admin/cash-orders', icon: 'dollar' as const },
    { label: 'Users', path: '/admin/users', icon: 'account-group' as const },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: 'shield-check' as const },
    { label: 'Reports', path: '/reports', icon: 'file-document' as const },
    { label: 'App Updates', path: '/admin/updates', icon: 'smartphone' as const },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className={`min-h-screen flex bg-bg-page transition-colors duration-300 ${isAdminRoute ? 'admin-layout' : ''}`}>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-72 glass-heavy fixed top-0 bottom-0 left-0 z-20 border-r-0 rounded-r-3xl">
        <div className="h-20 flex items-center gap-3 px-8 border-b border-border/50">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/RAD5 Cafe.svg" alt="RAD5 Café" className="w-10 h-10" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-text-main">RAD5 Café</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">Smart Wallet</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`group flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-text-main font-extrabold'
                    : 'text-text-secondary font-semibold hover:bg-bg-selected hover:text-text-main'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 ${isActive ? 'text-text-main' : 'text-text-secondary group-hover:text-text-main'}`}>
                    <Icon name={item.icon} size={18} color="currentColor" />
                  </div>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}

        </nav>

        {/* Bottom Switch & Sign Out Area */}
        <div className="p-4 border-t border-border/50 mt-auto flex flex-col gap-1.5">
          {isAdmin ? (
            <button
              onClick={handleSwitchToPersonal}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-tint hover:bg-tint/10 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <Icon name="sync" size={18} color="var(--color-tint)" />
              <span>Switch to Personal</span>
            </button>
          ) : (
            <button
              onClick={handleSwitchToAdmin}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-tint hover:bg-tint/10 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <Icon name="shield-check" size={18} color="var(--color-tint)" />
              <span>Switch to Admin</span>
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-error-val hover:bg-error-val/10 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <Icon name="log-out" size={18} color="var(--color-error)" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-72 min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-6 glass sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <img src="/RAD5 Cafe.svg" alt="RAD5 Café" className="w-8 h-8" />
            <span className="font-extrabold text-base tracking-tight text-text-main">RAD5 Café</span>
          </div>
          <Link
            to="/notifications"
            className="p-2 rounded-full hover:bg-bg-selected text-text-main relative"
          >
            <Icon name="bell" size={20} />
          </Link>
        </header>

        <main className="flex-1 overflow-x-hidden p-6 md:p-10 pb-24 md:pb-10">
          <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6">
            {showBanner && appUpdateInfo && (
              <div className="p-4 bg-tint/10 border border-tint/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in select-none">
                <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                  <div className="w-10 h-10 rounded-xl bg-tint/15 flex items-center justify-center flex-shrink-0 text-tint mt-0.5">
                    <Icon name="smartphone" size={20} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-extrabold text-sm text-text-main">
                      New Mobile Update Available (v{appUpdateInfo.version})!
                    </span>
                    <span className="text-text-secondary text-xs leading-normal">
                      The new version brings massive improvements and up to 5% cashback rewards on Mobile purchases (higher than 3% on Web). Download the latest Android app now!
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <a
                    href={appUpdateInfo.apkLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial w-full sm:w-auto px-4 py-2 rounded-xl bg-tint hover:bg-tint/90 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Icon name="download" size={14} />
                    <span>Download APK</span>
                  </a>
                </div>
              </div>
            )}

            {!isAuthRoute && permissionStatus !== 'granted' && (
              <div className="bg-tint/10 border border-tint/25 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tint/20 text-tint flex items-center justify-center flex-shrink-0 animate-pulse-slow">
                    <Icon name="bell" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-main">Enable Web Notifications</h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Get real-time updates for orders, wallet transfers, and low stock alerts directly in your browser.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    registerWebPush()
                      .then(() => showToast('Push notifications registration triggered.', 'success'))
                      .catch(() => showToast('Failed to trigger notification registration.', 'error'));
                  }}
                  className="px-4 py-2 bg-tint hover:bg-tint/90 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  Enable Notifications
                </button>
              </div>
            )}
            {children}
          </div>
        </main>

        {/* Mobile Sticky Bottom Navbar */}
        <nav className="md:hidden sticky bottom-0 w-full h-16 glass flex items-center px-2 z-20 shadow-lg overflow-x-auto scrollbar-none snap-x">
          <div className="flex items-center justify-around min-w-full gap-2 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/admin' && ['/admin', '/admin/users', '/admin/audit-logs', '/inventory', '/analytics', '/sales', '/reports', '/accounting'].includes(location.pathname));
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex flex-col items-center justify-center w-14 h-12 shrink-0 snap-center rounded-xl transition-all duration-200 ${
                    isActive ? 'text-tint-dark font-extrabold' : 'text-black dark:text-white'
                  }`}
                >
                  <Icon name={item.icon} size={20} color={isActive ? 'var(--color-tint-dark)' : 'currentColor'} />
                  <span className="text-[10px] font-bold mt-1 leading-none whitespace-nowrap">{item.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Floating Bottom Cart Status Bar */}
      {!isAuthRoute && cartCount > 0 && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-[19.5rem] md:right-6 glass-heavy rounded-xl p-4 flex justify-between items-center z-30 animate-slide-up">
          <div className="flex flex-col">
            <span className="text-xs text-text-secondary font-semibold">{cartCount} items in basket</span>
            <span className="text-lg font-extrabold text-tint">₦{cartTotal.toLocaleString()}</span>
          </div>
          <Button variant="primary" size="md" onClick={() => setIsCartOpen(true)}>
            View Cart Checkout
          </Button>
        </div>
      )}

      {/* Global Checkout Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderPlaced={() => {
          window.dispatchEvent(new Event('order-placed'));
        }}
      />

      {/* Full Name Prompt Modal */}
      <FullNameModal
        isOpen={showFullNameModal}
        onDismiss={() => setShowFullNameModal(false)}
        onDone={() => setShowFullNameModal(false)}
      />
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ToastProvider>
          <NotificationProvider>
            <AuthProvider>
              <CartProvider>
                <ConfirmProvider>
                  <AppLayout>{children}</AppLayout>
                </ConfirmProvider>
              </CartProvider>
            </AuthProvider>
          </NotificationProvider>
        </ToastProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-page p-6 text-center select-none">
      <div className="w-16 h-16 rounded-full bg-error-val/10 flex items-center justify-center text-error-val mb-4">
        <Icon name="alert-triangle" size={32} />
      </div>
      <h1 className="text-3xl font-extrabold text-text-main mb-2">{message}</h1>
      <p className="text-text-secondary text-base max-w-md mb-6">{details}</p>
      {stack && (
        <pre className="w-full max-w-lg p-4 bg-bg-element border border-border rounded-xl text-left overflow-x-auto text-xs font-mono text-text-secondary select-all">
          <code>{stack}</code>
        </pre>
      )}
      <a
        href="/dashboard"
        className="px-5 py-2.5 bg-tint text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all mt-4"
      >
        Go back home
      </a>
    </main>
  );
}
