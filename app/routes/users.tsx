import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GlassSheet } from '~/components/ui/glass-panel';
import { PillButton } from '~/components/ui/pill-button';
import { IconButton } from '~/components/ui/icon-button';
import { Icon } from '~/components/ui/icon';
import { Money } from '~/components/ui/money';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { SheetField } from '~/components/ui/action-sheet-modal';
import { useToast } from '~/context/toast-context';
import { useConfirm } from '~/context/confirm-context';
import { AddAdminModal, type PermissionOption } from '~/components/modals/add-admin-modal';
import { api } from '~/lib/api';

type User = {
  id: string;
  uid: string;
  firebaseUid: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: string;
  walletId: string;
  pinSetup: boolean;
  expoPushToken: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

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

function getDisplayName(user: any): string {
  const name = user.fullName || '';
  if (!name || name.toLowerCase() === 'unkwun customer' || name.toLowerCase() === 'unknown customer' || name.toLowerCase() === 'unknown') {
    return user.email || name || 'Unnamed User';
  }
  return name || 'Unnamed User';
}

function StatusChip({ label, tone }: { label: string; tone: string }) {
  return <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-tint-a ${tone}`}>{label}</span>;
}

export function meta() {
  return [
    { title: "Users & Access - RAD5 Café" },
    { name: "description", content: "Manage customer accounts, view balances, and toggle account status." },
  ];
}

export default function Users() {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [permissionOptions, setPermissionOptions] = useState<PermissionOption[]>([]);
  const [fullAccess, setFullAccess] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showWalletAdjust, setShowWalletAdjust] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDesc, setWalletDesc] = useState('');
  const [walletPin, setWalletPin] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  const [timeline, setTimeline] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineTotalPages, setTimelineTotalPages] = useState(1);
  const [timelineTotal, setTimelineTotal] = useState(0);
  const limit = 20;

  const fetchUsers = useCallback((pageNum: number) => {
    setLoading(true);
    api.admin.users.list(pageNum, limit)
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) {
          setUsers(res.data);
          setTotal(res.total ?? res.data.length);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? res.data.length) / limit));
        } else {
          setUsers([]);
        }
      })
      .catch((err: any) => {
        console.warn('Could not load users:', err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  useEffect(() => {
    api.auth.me().then((res: any) => {
      if (res.success && res.data) {
        const full = res.data.role === 'admin' && !Array.isArray(res.data.permissions);
        setFullAccess(full);
        if (full) {
          api.admin.permissions.list().then((r: any) => {
            if (r.success && Array.isArray(r.data)) setPermissionOptions(r.data);
          }).catch(() => {});
        }
      }
    }).catch(() => {});
  }, []);

  const fetchTimeline = (userId: string, pageNum: number) => {
    setTimelineLoading(true);
    api.adminDashboard.users.history(userId, { page: pageNum, limit: 20 })
      .then((res: any) => {
        setTimeline(res.timeline ?? []);
        setStats(res.stats ?? null);
        setTimelineTotal(res.total ?? 0);
        setTimelineTotalPages(res.totalPages ?? 1);
      })
      .catch((err: any) => {
        console.warn('Could not load timeline:', err);
        setTimeline([]);
      })
      .finally(() => setTimelineLoading(false));
  };

  const openUserDetail = (user: User) => {
    setSelectedUser(user);
    setMenuOpen(false);
    setShowWalletAdjust(false);
    setWalletAmount('');
    setWalletDesc('');
    setWalletPin('');
    setTimeline([]);
    setStats(null);
    setTimelinePage(1);
    fetchTimeline(user.id, 1);
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
    setMenuOpen(false);
    setShowWalletAdjust(false);
  };

  const handleToggleStatus = async (user: User) => {
    const confirmed = await showConfirm({
      title: user.isActive ? 'Deactivate user' : 'Activate user',
      message: user.isActive
        ? `Are you sure you want to deactivate ${getDisplayName(user)}? They will no longer be able to access their account.`
        : `Are you sure you want to reactivate ${getDisplayName(user)}? They will regain full access to their account.`,
      variant: user.isActive ? 'danger' : 'default',
      confirmLabel: user.isActive ? 'Deactivate' : 'Activate',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    setTogglingUserId(user.id);
    try {
      const res = await api.admin.users.toggleStatus(user.id);
      if (res.success) {
        showToast({ type: 'success', title: `User ${user.isActive ? 'deactivated' : 'activated'}` });
        fetchUsers(page);
        if (selectedUser?.id === user.id) setSelectedUser({ ...user, isActive: !user.isActive });
      } else {
        showToast({ type: 'error', title: 'Failed to update user status', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update user status', message: err.message });
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleSetRole = async (user: User, newRole: string) => {
    const isPromoting = newRole === 'admin';
    const confirmed = await showConfirm({
      title: isPromoting ? 'Promote to admin' : 'Remove admin',
      message: isPromoting
        ? `Are you sure you want to make ${getDisplayName(user)} an admin? They will gain full access to the admin panel.`
        : `Are you sure you want to remove admin privileges from ${getDisplayName(user)}?`,
      variant: isPromoting ? 'default' : 'danger',
      confirmLabel: isPromoting ? 'Make admin' : 'Remove admin',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    try {
      const res = await api.admin.users.setRole(user.uid, newRole);
      if (res.success) {
        showToast({ type: 'success', title: `User role updated to ${newRole}` });
        fetchUsers(page);
        if (selectedUser?.id === user.id) setSelectedUser({ ...user, role: newRole });
      } else {
        showToast({ type: 'error', title: 'Failed to update user role', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update user role', message: err.message });
    }
  };

  const handleWalletAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !walletAmount || !walletPin) {
      showToast({ type: 'warning', title: 'Amount and PIN are required.' });
      return;
    }
    setWalletLoading(true);
    try {
      const res = await api.adminDashboard.wallet.adjust({
        userId: selectedUser.id,
        amount: Number(walletAmount),
        description: walletDesc.trim() || `Admin balance adjustment for ${getDisplayName(selectedUser)}`,
        pin: walletPin,
      });
      if (res.success) {
        showToast({ type: 'success', title: 'Wallet adjusted', message: res.data?.balance != null ? `New balance: ₦${Number(res.data.balance).toLocaleString()}` : undefined });
        setWalletAmount('');
        setWalletDesc('');
        setWalletPin('');
        setShowWalletAdjust(false);
        fetchTimeline(selectedUser.id, 1);
      } else {
        showToast({ type: 'error', title: 'Balance adjustment failed', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Balance adjustment failed', message: err.message });
    } finally {
      setWalletLoading(false);
    }
  };

  const changeTimelinePage = (newPage: number) => {
    if (!selectedUser) return;
    setTimelinePage(newPage);
    fetchTimeline(selectedUser.id, newPage);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const visibleUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return getDisplayName(u).toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
  });

  const columns: DataTableColumn<User>[] = [
    {
      key: 'user', header: 'User', width: '1.8fr',
      render: (u) => (
        <button onClick={() => openUserDetail(u)} className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-tint-b text-tint grid place-items-center flex-shrink-0 text-xs font-bold">
            {getDisplayName(u)[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{getDisplayName(u)}</div>
            <div className="text-[11px] text-text-secondary truncate">{u.email}</div>
          </div>
        </button>
      ),
    },
    {
      key: 'status', header: 'Status', width: '1.1fr',
      render: (u) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {u.role === 'admin' && <StatusChip label="Admin" tone="text-warn" />}
          <StatusChip label={u.isActive ? 'Active' : 'Inactive'} tone={u.isActive ? 'text-ok' : 'text-err'} />
        </div>
      ),
    },
    {
      key: 'joined', header: 'Joined', width: '1fr',
      render: (u) => <span className="text-[12px] text-text-secondary">{new Date(parseDate(u.createdAt)).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>,
    },
    {
      key: 'actions', header: '', width: '1fr', align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          {(u.role !== 'admin' || fullAccess) && (
            <IconButton
              icon={u.isActive ? 'zap-off' : 'check'}
              size={36} iconSize={14}
              title={u.isActive ? 'Deactivate' : 'Activate'}
              onClick={() => handleToggleStatus(u)}
              disabled={togglingUserId === u.id}
            />
          )}
          {fullAccess && (
            <IconButton
              icon="shield-check"
              size={36} iconSize={14}
              title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
              onClick={() => handleSetRole(u, u.role === 'admin' ? 'customer' : 'admin')}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="sticky top-0 z-30 py-3 -my-2 bg-bg-page/90 backdrop-blur-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Users & access</h1>
          <p className="text-text-secondary text-xs mt-1">{total} registered users · Page {page} of {totalPages}</p>
        </div>

        {fullAccess && (
          <div className="flex items-center gap-2">
            <a
              href="/admin/manage-admins"
              className="px-4 py-2.5 rounded-xl border border-border bg-card text-text-main text-xs font-bold cursor-pointer hover:border-tint transition-colors flex items-center gap-1.5"
            >
              <Icon name="shield-check" size={14} />
              Manage Admins
            </a>
            <button
              type="button"
              onClick={() => setShowAddAdminModal(true)}
              className="px-4 py-2.5 rounded-xl border-none bg-tint-dark text-white text-xs font-bold cursor-pointer hover:bg-tint transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Icon name="plus" size={14} />
              Add Admin
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative max-w-md w-full">
          <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-chip text-sm pl-9 pr-4 py-2.5 rounded-full outline-none focus:border-tint placeholder:text-text-secondary transition-colors border"
          />
        </div>

        <div className="flex gap-2">
          <PillButton active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>All Users</PillButton>
          <PillButton active={roleFilter === 'admin'} onClick={() => setRoleFilter('admin')}>Admins</PillButton>
          <PillButton active={roleFilter === 'customer'} onClick={() => setRoleFilter('customer')}>Customers</PillButton>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={visibleUsers}
        keyExtractor={(u) => u.id}
        loading={loading}
        emptyMessage="No users found."
        minWidth={640}
      />

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <PillButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</PillButton>
          <span className="text-xs font-bold text-text-secondary">Page {page} of {totalPages}</span>
          <PillButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PillButton>
        </div>
      )}

      {selectedUser && (
        <div onClick={closeUserDetail} className="fixed inset-0 z-50 grid place-items-center p-5" style={{ background: 'rgba(17,24,39,0.4)', backdropFilter: 'blur(6px)' }}>
          <GlassSheet onClick={(e) => e.stopPropagation()} className="w-full animate-rad5-pop max-h-[88vh] overflow-y-auto flex flex-col gap-4" style={{ maxWidth: 460 }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-tint-b text-tint grid place-items-center flex-shrink-0 text-lg font-bold">
                  {getDisplayName(selectedUser)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold truncate">{getDisplayName(selectedUser)}</h3>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <StatusChip label={selectedUser.role} tone={selectedUser.role === 'admin' ? 'text-warn' : 'text-tint'} />
                    <StatusChip label={selectedUser.isActive ? 'Active' : 'Inactive'} tone={selectedUser.isActive ? 'text-ok' : 'text-err'} />
                    {selectedUser.pinSetup && <StatusChip label="PIN set" tone="text-tint" />}
                  </div>
                </div>
              </div>

              <div className="relative flex-shrink-0" ref={menuRef}>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-tint-a transition-colors cursor-pointer">
                  <Icon name="more-vertical" size={16} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 glass-sheet rounded-xl overflow-hidden z-10 animate-rad5-pop">
                    <button onClick={() => { setMenuOpen(false); setShowWalletAdjust((v) => !v); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-tint-a transition-colors flex items-center gap-2.5 cursor-pointer">
                      <Icon name="bank" size={14} className="text-tint" />
                      Adjust wallet
                    </button>
                    {(selectedUser.role !== 'admin' || fullAccess) && (
                      <button
                        onClick={() => { setMenuOpen(false); handleToggleStatus(selectedUser); }}
                        disabled={togglingUserId === selectedUser.id}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-tint-a transition-colors flex items-center gap-2.5 cursor-pointer disabled:opacity-50 ${selectedUser.isActive ? 'text-err' : 'text-ok'}`}
                      >
                        <Icon name={selectedUser.isActive ? 'zap-off' : 'check'} size={14} />
                        {togglingUserId === selectedUser.id ? 'Updating…' : selectedUser.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {fullAccess && (
                      <button
                        onClick={() => { setMenuOpen(false); handleSetRole(selectedUser, selectedUser.role === 'admin' ? 'customer' : 'admin'); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-tint-a transition-colors flex items-center gap-2.5 cursor-pointer ${selectedUser.role === 'admin' ? 'text-err' : 'text-warn'}`}
                      >
                        <Icon name="shield-check" size={14} />
                        {selectedUser.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-3.5 border-y border-border">
              <div className="flex flex-col gap-0.5"><span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Email</span><span className="text-xs font-bold truncate">{selectedUser.email}</span></div>
              <div className="flex flex-col gap-0.5"><span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Phone</span><span className="text-xs font-bold">{selectedUser.phoneNumber || '—'}</span></div>
              <div className="flex flex-col gap-0.5"><span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">User ID</span><span className="text-xs font-bold truncate">{selectedUser.uid}</span></div>
              <div className="flex flex-col gap-0.5"><span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Wallet ID</span><span className="text-xs font-bold truncate">{selectedUser.walletId}</span></div>
              <div className="flex flex-col gap-0.5"><span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Joined</span><span className="text-xs font-bold">{new Date(parseDate(selectedUser.createdAt)).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
              <div className="flex flex-col gap-0.5"><span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Status</span><span className={`text-xs font-bold ${selectedUser.isActive ? 'text-ok' : 'text-err'}`}>{selectedUser.isActive ? 'Active' : 'Inactive'}</span></div>
            </div>

            {showWalletAdjust && (
              <form onSubmit={handleWalletAdjust} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1 h-5 bg-tint rounded-full" />
                  <span className="text-sm font-bold">Wallet adjustment</span>
                </div>
                <SheetField label="Amount (₦)" value={walletAmount} onChange={setWalletAmount} type="number" mono placeholder="5000 to credit, -2000 to debit" required autoFocus />
                <SheetField label="Reason" value={walletDesc} onChange={setWalletDesc} placeholder="e.g. Compensation, manual top-up" />
                <SheetField label="Transaction PIN" value={walletPin} onChange={(v) => setWalletPin(v.replace(/\D/g, ''))} type="password" mono maxLength={4} placeholder="4-digit PIN" required />
                <div className="flex gap-2 justify-end mt-3">
                  <button type="button" onClick={() => setShowWalletAdjust(false)} className="px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors">Cancel</button>
                  <button type="submit" disabled={walletLoading} className="px-4 py-2 rounded-xl border-none bg-tint-dark text-white text-xs font-bold cursor-pointer hover:bg-tint disabled:opacity-50 transition-colors">
                    {walletLoading ? 'Adjusting…' : 'Adjust balance'}
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 bg-tint rounded-full" />
                <span className="text-sm font-bold">Activity timeline</span>
                <span className="text-[10px] text-text-secondary">({timelineTotal} record{timelineTotal !== 1 ? 's' : ''})</span>
              </div>

              {stats && (
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-tint-a p-3 rounded-xl">
                  <div className="flex flex-col"><span className="text-text-secondary font-semibold">Total spent</span><Money amount={stats.totalSpent || 0} className="font-bold text-err" /></div>
                  <div className="flex flex-col"><span className="text-text-secondary font-semibold">Total funded</span><Money amount={stats.totalFunded || 0} className="font-bold text-ok" /></div>
                  <div className="flex flex-col"><span className="text-text-secondary font-semibold">Orders</span><span className="font-bold">{stats.orderCount || 0}</span></div>
                  <div className="flex flex-col"><span className="text-text-secondary font-semibold">Transactions</span><span className="font-bold">{stats.transactionCount || 0}</span></div>
                </div>
              )}

              {timelineLoading ? (
                <div className="flex justify-center items-center py-8">
                  <span className="w-6 h-6 rounded-full border-2 border-tint border-t-transparent animate-spin" />
                </div>
              ) : timeline.length === 0 ? (
                <div className="text-center py-6 text-text-secondary text-xs">No activity history for this user.</div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-60 pr-1">
                  {timeline.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-tint-a flex flex-col gap-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">{item.title}</span>
                          <span className="text-[10px] text-text-secondary truncate">{item.description}</span>
                        </div>
                        <StatusChip label={item.type.replace('_', ' ')} tone={item.type === 'order' ? 'text-warn' : 'text-tint'} />
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        {item.amount ? <Money amount={item.amount} showSign className={`text-xs font-bold ${item.amount > 0 ? 'text-ok' : 'text-err'}`} /> : <span className="text-xs text-text-secondary">—</span>}
                        <div className="flex flex-col items-end gap-0.5 text-[10px] text-text-secondary">
                          <span className="font-semibold capitalize">{item.status || 'logged'}</span>
                          <span>{new Date(parseDate(item.createdAt)).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {timelineTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <PillButton onClick={() => changeTimelinePage(Math.max(1, timelinePage - 1))} disabled={timelinePage <= 1}>Previous</PillButton>
                  <span className="text-[10px] font-bold text-text-secondary">{timelinePage} / {timelineTotalPages}</span>
                  <PillButton onClick={() => changeTimelinePage(Math.min(timelineTotalPages, timelinePage + 1))} disabled={timelinePage >= timelineTotalPages}>Next</PillButton>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-border pt-3.5">
              <button onClick={closeUserDetail} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold cursor-pointer hover:border-tint hover:text-tint transition-colors">Close</button>
            </div>
          </GlassSheet>
        </div>
      )}

      <AddAdminModal
        isOpen={showAddAdminModal}
        onClose={() => setShowAddAdminModal(false)}
        onSuccess={() => fetchUsers(page)}
        permissionOptions={permissionOptions}
      />
    </div>
  );
}
