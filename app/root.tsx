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
import { NotificationProvider } from './context/notification-context';
import { CartProvider, useCart } from './context/cart-context';
import { ConfirmProvider, useConfirm } from './context/confirm-context';
import { Icon } from './components/ui/icon';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { CartModal } from './components/modals/cart-modal';
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
];

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { showConfirm } = useConfirm();
  const { showToast } = useToast();
  const { cartCount, cartTotal } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const isAuthRoute = ['/login', '/register', '/setup-pin'].includes(location.pathname);

  // Check user profile for admin role
  useEffect(() => {
    if (user) {
      // Immediately set isAdmin if client-side user role is admin
      if (user.role === 'admin' || user.email === 'admin@rad5.cafe' || user.email === 'admin@rad5cafe.com') {
        setIsAdmin(true);
      }

      api.auth.me().then((res) => {
        if (res.success && res.data) {
          setProfile(res.data);
          if (res.data.role === 'admin' || res.data.email === 'admin@rad5.cafe' || res.data.email === 'admin@rad5cafe.com') {
            setIsAdmin(true);
          }
        }
      }).catch(() => {});
    } else {
      setIsAdmin(false);
      setProfile(null);
    }
  }, [user]);

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

  // Auth Redirection Guard
  useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      navigate('/login');
    }
  }, [user, loading, isAuthRoute, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-page gap-4">
        <svg
          className="animate-spin h-10 w-10 text-tint"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="text-sm font-semibold text-text-secondary">Loading RAD5 Café...</span>
      </div>
    );
  }

  // Render Auth screens without global layout wrappers
  if (isAuthRoute) {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'bank' as const },
    { label: 'Café Menu', path: '/cafe', icon: 'cart' as const },
    { label: 'Transactions', path: '/history', icon: 'sync' as const },
    { label: 'Notifications', path: '/notifications', icon: 'bell' as const },
    { label: 'My Profile', path: '/profile', icon: 'user' as const },
    ...(isAdmin ? [
      { label: 'Admin Panel', path: '/admin', icon: 'chart-bar' as const },
      { label: 'Inventory', path: '/inventory', icon: 'package-variant-closed' as const },
      { label: 'Analytics', path: '/analytics', icon: 'trending-up' as const },
      { label: 'Sales Logs', path: '/sales', icon: 'dollar' as const },
      { label: 'Reports', path: '/reports', icon: 'file-document' as const },
    ] : []),
  ];

  return (
    <div className="min-h-screen flex bg-bg-page">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-72 bg-card border-r border-border fixed top-0 bottom-0 left-0 z-20">
        <div className="h-20 flex items-center gap-3 px-8 border-b border-border">
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
                className={`flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-tint text-white shadow-md shadow-tint/10'
                    : 'text-text-secondary hover:bg-bg-selected hover:text-text-main'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon name={item.icon} size={18} color={isActive ? '#FFFFFF' : 'var(--color-text-secondary)'} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}

        </nav>

        {/* Bottom Sign Out Area */}
        <div className="p-4 border-t border-border mt-auto">
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
        <header className="md:hidden h-16 flex items-center justify-between px-6 bg-card border-b border-border sticky top-0 z-20">
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

        {/* Content Body */}
        <main className="flex-1 overflow-x-hidden p-6 md:p-10 pb-24 md:pb-10">
          <div className="max-w-[1200px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile Sticky Bottom Navbar */}
        <nav className="md:hidden sticky bottom-0 w-full h-16 bg-card border-t border-border flex items-center justify-around px-2 z-20 shadow-lg">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/admin' && ['/admin', '/inventory', '/analytics', '/sales', '/reports'].includes(location.pathname));
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-tint' : 'text-text-secondary'
                }`}
              >
                <Icon name={item.icon} size={20} color={isActive ? 'var(--color-tint)' : 'var(--color-text-secondary)'} />
                <span className="text-[10px] font-bold mt-1 leading-none">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Floating Bottom Cart Status Bar */}
      {!isAuthRoute && cartCount > 0 && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-[19.5rem] md:right-6 bg-card border border-border rounded-xl p-4 flex justify-between items-center shadow-2xl z-30 animate-slide-up">
          <div className="flex flex-col">
            <span className="text-xs text-text-secondary font-semibold">{cartCount} items in basket</span>
            <span className="text-lg font-extrabold text-tint">₦{cartTotal.toLocaleString()}</span>
          </div>
          <Button variant="primary" size="md" onClick={() => setShowCart(true)}>
            View Cart Checkout
          </Button>
        </div>
      )}

      {/* Global Checkout Modal */}
      <CartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onOrderPlaced={() => {
          window.dispatchEvent(new Event('order-placed'));
        }}
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
        href="/"
        className="px-5 py-2.5 bg-tint text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all mt-4"
      >
        Go back home
      </a>
    </main>
  );
}
