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
import { ThemeProvider } from './context/theme-context';
import { Icon } from './components/ui/icon';
import { NavRail, type NavRailItem } from './components/ui/nav-rail';
import { TopBar } from './components/ui/top-bar';
import { CartModal } from './components/modals/cart-modal';
import { FullNameModal } from './components/modals/fullname-modal';
import { CartPill } from './components/ui/cart-pill';
import { api } from './lib/api';
import { useViewport } from './lib/use-viewport';
import { logPageView, logElementClick, setAnalyticsActor } from './lib/analytics';

const PAGE_TITLES: Record<string, { crumb: string; title: string }> = {
  '/dashboard': { crumb: 'Wallet', title: 'Wallet' },
  '/cafe': { crumb: 'Café', title: "Today's menu" },
  '/history': { crumb: 'Wallet', title: 'Transaction history' },
  '/notifications': { crumb: 'Activity', title: 'Notifications' },
  '/profile': { crumb: 'Account', title: 'Profile & security' },
  '/admin': { crumb: 'Console', title: 'Admin panel' },
  '/inventory': { crumb: 'Console', title: 'Inventory' },
  '/sales': { crumb: 'Console', title: 'Sales logs' },
  '/accounting': { crumb: 'Console', title: 'Accounting reconciliation' },
  '/accounting/manual': { crumb: 'Console', title: 'Manual accounting override' },
  '/analytics': { crumb: 'Console', title: 'Advanced analytics' },
  '/admin/stock-balance': { crumb: 'Console', title: 'Stock balance out' },
  '/admin/users': { crumb: 'Console', title: 'Users & access' },
  '/admin/pin-changes': { crumb: 'Console', title: 'PIN change requests' },
  '/admin/audit-logs': { crumb: 'Console', title: 'Audit logs' },
  '/admin/cash-orders': { crumb: 'Console', title: 'Cash orders' },
  '/admin/expenses': { crumb: 'Console', title: 'Sales ledger / expenses' },
  '/admin/updates': { crumb: 'Console', title: 'App updates' },
  '/admin/products/add': { crumb: 'Console', title: 'Add product' },
  '/reports': { crumb: 'Console', title: 'Reports' },
  '/admin/manage-admins': { crumb: 'Console', title: 'Manage admins' },
};

// Maps an admin-console route to the permission key required to view it.
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin': 'dashboard',
  '/inventory': 'inventory',
  '/analytics': 'analytics',
  '/accounting': 'accounting',
  '/accounting/manual': 'accounting',
  '/sales': 'sales',
  '/admin/expenses': 'expenses',
  '/admin/stock-balance': 'stock_balance',
  '/admin/cash-orders': 'cash_orders',
  '/admin/users': 'users',
  '/admin/audit-logs': 'audit_logs',
  '/reports': 'reports',
  '/admin/updates': 'updates',
  '/admin/products/add': 'products',
  '/admin/pin-changes': 'pin_changes',
  '/admin/rewards': 'rewards',
};

// Where a restricted sub-admin lands when the section they tried to view
// (including '/admin' itself, now that the overview needs 'dashboard') is
// off-limits. Checked in order; first permitted route wins. If the admin
// has none of these, they fall through to the regular customer dashboard.
const ADMIN_FALLBACK_ROUTES: Array<[string, string]> = [
  ['/inventory', 'inventory'],
  ['/sales', 'sales'],
  ['/accounting', 'accounting'],
  ['/analytics', 'analytics'],
  ['/admin/stock-balance', 'stock_balance'],
  ['/admin/users', 'users'],
  ['/admin/rewards', 'rewards'],
  ['/admin/pin-changes', 'pin_changes'],
  ['/admin/products/add', 'products'],
  ['/reports', 'reports'],
  ['/admin/updates', 'updates'],
  ['/admin/expenses', 'expenses'],
  ['/admin/cash-orders', 'cash_orders'],
  ['/admin/audit-logs', 'audit_logs'],
];

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
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
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [appUpdateInfo, setAppUpdateInfo] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showFullNameModal, setShowFullNameModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const { narrow } = useViewport();

  const isAuthRoute = ['/', '/login', '/register', '/setup-pin'].includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/admin') ||
                       ['/inventory', '/analytics', '/sales', '/reports', '/accounting'].includes(location.pathname);

  // Lightweight unread-notifications count for the top-bar bell badge — reuses
  // the same read path as the Notifications screen, refetched on navigation
  // so the badge stays in sync after visiting/marking-read there.
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    api.notifications.list(1, 20).then((res: any) => {
      const rawList = res.data || res.notifications;
      if (res.success && Array.isArray(rawList)) {
        const unread = rawList.filter((n: any) => !(n.read ?? n.isRead ?? false)).length;
        setUnreadCount(unread);
      }
    }).catch(() => {});
  }, [user, location.pathname]);

  // Check user profile for admin role
  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      api.auth.me().then((res) => {
        if (res.success && res.data) {
          setProfile(res.data);
          if (res.data.role === 'admin' || user.email === 'admin@rad5.cafe' || res.data.email === 'admin@rad5.cafe') {
            setIsAdmin(true);
            // undefined/null permissions = full-access (grandfathered) admin.
            setPermissions(Array.isArray(res.data.permissions) ? res.data.permissions : null);
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
      setPermissions(null);
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

  // Analytics: page_view on every route change.
  useEffect(() => {
    const pm = PAGE_TITLES[location.pathname];
    void logPageView(location.pathname, pm?.title);
  }, [location.pathname]);

  // Analytics: tag events to the signed-in user + customer/admin role.
  useEffect(() => {
    void setAnalyticsActor(user?.uid ?? null, user ? (isAdmin ? 'admin' : 'customer') : undefined);
  }, [user, isAdmin]);

  // Analytics: autocapture every click on an interactive element (button,
  // link, or anything with role="button") — one listener, no per-button
  // tagging needed. Installed once; reads the live pathname at click time.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as Element)?.closest?.(
        'button, a, [role="button"], input[type="submit"], input[type="button"]'
      ) as HTMLElement | null;
      if (!target) return;
      const text = (target.getAttribute('aria-label') || target.textContent || '').trim().slice(0, 80);
      void logElementClick({
        tag: target.tagName.toLowerCase(),
        text: text || undefined,
        id: target.id || undefined,
        route: window.location.pathname,
      });
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

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
    if (!loading && !profileLoading) {
      if (!user && !isAuthRoute) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      } else if (user && isAdminRoute && !isAdmin) {
        navigate('/dashboard');
      }
    }
  }, [user, loading, profileLoading, isAuthRoute, isAdminRoute, isAdmin, navigate, location.pathname]);

  // undefined/null permissions on a loaded admin profile = full access
  // (the grandfathered "highest" tier). A defined array restricts a
  // sub-admin to just those permission keys.
  const fullAccess = isAdmin && permissions === null;
  const hasPermission = (key: string) => fullAccess || (permissions || []).includes(key);

  // '/admin' itself now requires 'dashboard', so a denied admin can't just
  // be bounced back there — find the first section they actually have.
  // Falls through to the regular customer dashboard if they have none.
  const firstAccessibleAdminRoute = () => {
    const hit = ADMIN_FALLBACK_ROUTES.find(([, perm]) => hasPermission(perm));
    return hit ? hit[0] : '/dashboard';
  };

  // Sub-admin permission guard — the nav rail already hides sections a
  // restricted sub-admin can't see, but this catches direct URL navigation.
  useEffect(() => {
    if (loading || profileLoading || !isAdmin || fullAccess) return;
    if (location.pathname === '/admin/manage-admins') {
      showToast('Only full-access admins can manage other admins.', 'warning');
      navigate(firstAccessibleAdminRoute());
      return;
    }
    const requiredPerm = ROUTE_PERMISSIONS[location.pathname];
    if (requiredPerm && !hasPermission(requiredPerm)) {
      showToast(
        location.pathname === '/admin'
          ? "You don't have permission to view the dashboard overview."
          : 'You do not have permission to view that section.',
        'warning'
      );
      navigate(firstAccessibleAdminRoute());
    }
  }, [location.pathname, isAdmin, fullAccess, permissions, loading, profileLoading]);

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

  const userNavItems: Omit<NavRailItem, 'active'>[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'bank' },
    { label: 'Café Menu', path: '/cafe', icon: 'cart' },
    { label: 'Transactions', path: '/history', icon: 'sync' },
    { label: 'Notifications', path: '/notifications', icon: 'bell', badgeCount: unreadCount },
    { label: 'My Profile', path: '/profile', icon: 'user' },
  ];

  const adminNavItems: Omit<NavRailItem, 'active'>[] = [
    { label: 'Admin Panel', path: '/admin', icon: 'chart-bar' },
    { label: 'Inventory', path: '/inventory', icon: 'package-variant-closed' },
    { label: 'Analytics', path: '/analytics', icon: 'trending-up' },
    { label: 'Accounting', path: '/accounting', icon: 'cash' },
    { label: 'Sales Logs', path: '/sales', icon: 'dollar' },
    { label: 'Sales Ledger / Expenses', path: '/admin/expenses', icon: 'dollar' },
    { label: 'Stock Balance Out', path: '/admin/stock-balance', icon: 'scale' },
    { label: 'Cash Orders', path: '/admin/cash-orders', icon: 'dollar' },
    { label: 'PIN Approvals', path: '/admin/pin-changes', icon: 'lock' },
    { label: 'Users', path: '/admin/users', icon: 'account-group' },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: 'shield-check' },
    { label: 'Reports', path: '/reports', icon: 'file-document' },
    { label: 'App Updates', path: '/admin/updates', icon: 'smartphone' },
    ...(fullAccess ? [{ label: 'Manage Admins', path: '/admin/manage-admins', icon: 'shield-check' } as Omit<NavRailItem, 'active'>] : []),
  ];

  // A restricted sub-admin only sees nav entries for sections they have a
  // permission for — including '/admin' itself, which needs 'dashboard'.
  const visibleAdminNavItems = fullAccess
    ? adminNavItems
    : adminNavItems.filter((item) => hasPermission(ROUTE_PERMISSIONS[item.path] || '__none__'));

  const rawNavItems = isAdmin ? visibleAdminNavItems : userNavItems;
  // Every admin section (Inventory, Analytics, Sales, Reports, Users, Audit
  // Logs, Accounting...) has its own dedicated nav item below, so "Admin
  // Panel" should only highlight on '/admin' itself — an exact match keeps
  // its active state from being tied to whichever other section is open.
  const isNavItemActive = (path: string) => location.pathname === path;
  const navItems: NavRailItem[] = rawNavItems.map((item) => ({ ...item, active: isNavItemActive(item.path) }));

  const sidebarCollapsed = collapsed || narrow;
  const pageMeta = PAGE_TITLES[location.pathname] || { crumb: isAdminRoute ? 'Console' : 'RAD5', title: 'RAD5 Café' };
  const displayName = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || 'there';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <div
      className={`min-h-screen flex bg-bg-page transition-colors duration-300 relative ${isAdminRoute ? 'admin-layout' : ''}`}
      style={{ ['--sidebar-w' as string]: sidebarCollapsed ? '74px' : '246px' } as React.CSSProperties}
    >{/* --sidebar-w drives the floating cart bar's desktop left offset below */}
      {/* Ambient glass background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute -top-44 -left-28 w-[620px] h-[620px] rounded-full"
          style={{ background: 'radial-gradient(circle at 30% 30%, var(--tint-c), rgba(0,61,153,0) 70%)' }}
        />
        <div
          className="absolute top-28 -right-40 w-[560px] h-[560px] rounded-full"
          style={{ background: 'radial-gradient(circle at 60% 40%, rgba(59,130,246,0.18), rgba(59,130,246,0) 70%)' }}
        />
      </div>

      {/* Desktop Sidebar Navigation */}
      <NavRail
        items={navItems}
        sectionLabel={isAdmin ? 'ADMIN CONSOLE' : 'MY WALLET'}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        roleSwitchLabel={isAdmin ? 'Switch to personal' : 'Switch to admin'}
        roleSwitchIcon={isAdmin ? 'sync' : 'shield-check'}
        onRoleSwitch={isAdmin ? handleSwitchToPersonal : handleSwitchToAdmin}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-5 glass-surface sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <img src="/RAD5 Cafe.svg" alt="RAD5 Café" className="w-8 h-8" />
            <span className="font-extrabold text-base tracking-tight text-text-main">RAD5 Café</span>
          </div>
          <Link
            to="/notifications"
            className="relative p-2 rounded-full hover:bg-bg-selected text-text-main"
          >
            <Icon name="bell" size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-error-val" />
            )}
          </Link>
        </header>

        <main className="flex-1 overflow-x-clip p-4 sm:p-6 lg:p-8 pb-24 md:pb-10">
          <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6">
            <div className="hidden md:block">
              <TopBar crumb={pageMeta.crumb} title={pageMeta.title} unreadCount={unreadCount} userName={displayName} initials={initials} />
            </div>
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
        <nav className="md:hidden sticky bottom-0 w-full h-16 glass-surface border-t border-border flex items-center px-2 z-20 overflow-x-auto scrollbar-none snap-x" style={{ borderRadius: 0 }}>
          <div className="flex items-center justify-around min-w-full gap-2 px-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex flex-col items-center justify-center w-14 h-12 shrink-0 snap-center rounded-xl transition-all duration-300 relative ${
                  item.active ? 'text-tint font-extrabold scale-105' : 'text-text-secondary hover:text-text-main'
                }`}
              >
                <Icon name={item.icon} size={20} color={item.active ? 'var(--color-tint)' : 'currentColor'} />
                <span className="text-[10px] font-bold mt-1.5 leading-none whitespace-nowrap">{item.label.split(' ')[0]}</span>
                {item.active && <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-tint animate-pulse-slow" />}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Floating Cart Pill */}
      {!isAuthRoute && !isCartOpen && (
        <CartPill
          count={cartCount}
          total={cartTotal}
          onClick={() => setIsCartOpen(true)}
          className="right-4 bottom-20 md:right-6 md:bottom-6"
        />
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
        <ThemeProvider>
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
        </ThemeProvider>
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
