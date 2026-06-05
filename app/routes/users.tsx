import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useToast } from '~/context/toast-context';
import { useConfirm } from '~/context/confirm-context';
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

type PaymentLog = {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: {
    amount: number;
    amountKobo: number;
    transactionId: string;
    source: string;
  };
  ip: string;
  createdAt: string;
};

export function meta() {
  return [
    { title: "User Management - RAD5 Café" },
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

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showWalletAdjust, setShowWalletAdjust] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDesc, setWalletDesc] = useState('');
  const [walletPin, setWalletPin] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [paymentLogsLoading, setPaymentLogsLoading] = useState(false);
  const [paymentLogsPage, setPaymentLogsPage] = useState(1);
  const [paymentLogsTotalPages, setPaymentLogsTotalPages] = useState(1);
  const [paymentLogsTotal, setPaymentLogsTotal] = useState(0);
  const paymentLogsLimit = 50;

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

  const fetchPaymentLogs = (userId: string, pageNum: number) => {
    setPaymentLogsLoading(true);
    api.admin.users.paymentLogs(userId, pageNum, paymentLogsLimit)
      .then((res: any) => {
        const data = res.logs ?? res.data ?? [];
        setPaymentLogs(Array.isArray(data) ? data : []);
        setPaymentLogsTotal(res.total ?? 0);
        setPaymentLogsTotalPages(res.totalPages ?? Math.ceil((res.total ?? 0) / paymentLogsLimit));
      })
      .catch((err: any) => {
        console.warn('Could not load payment logs:', err);
        setPaymentLogs([]);
      })
      .finally(() => setPaymentLogsLoading(false));
  };

  const openUserDetail = (user: User) => {
    setSelectedUser(user);
    setMenuOpen(false);
    setShowWalletAdjust(false);
    setWalletAmount('');
    setWalletDesc('');
    setWalletPin('');
    setPaymentLogs([]);
    setPaymentLogsPage(1);
    fetchPaymentLogs(user.id, 1);
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
    setMenuOpen(false);
    setShowWalletAdjust(false);
  };

  const handleMenuAction = (action: string) => {
    setMenuOpen(false);
    if (action === 'wallet') {
      setShowWalletAdjust((prev) => !prev);
    } else if (action === 'toggle-status') {
      handleToggleStatus(selectedUser!);
    } else if (action === 'toggle-role') {
      const newRole = selectedUser!.role === 'admin' ? 'customer' : 'admin';
      handleSetRole(selectedUser!, newRole);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const confirmed = await showConfirm({
      title: user.isActive ? 'Deactivate User' : 'Activate User',
      message: user.isActive
        ? `Are you sure you want to deactivate ${user.fullName}? They will no longer be able to access their account.`
        : `Are you sure you want to reactivate ${user.fullName}? They will regain full access to their account.`,
      variant: user.isActive ? 'danger' : 'default',
      confirmLabel: user.isActive ? 'Deactivate' : 'Activate',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    setTogglingUserId(user.id);
    try {
      const res = await api.admin.users.toggleStatus(user.id);
      if (res.success) {
        showToast(`User ${user.isActive ? 'deactivated' : 'activated'} successfully.`, 'success');
        fetchUsers(page);
        if (selectedUser?.id === user.id) {
          setSelectedUser({ ...user, isActive: !user.isActive });
        }
      } else {
        showToast(res.message || 'Failed to update user status.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status.', 'error');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleSetRole = async (user: User, newRole: string) => {
    const isPromoting = newRole === 'admin';
    const confirmed = await showConfirm({
      title: isPromoting ? 'Promote to Admin' : 'Remove Admin',
      message: isPromoting
        ? `Are you sure you want to make ${user.fullName} an admin? They will gain full access to the admin panel.`
        : `Are you sure you want to remove admin privileges from ${user.fullName}?`,
      variant: isPromoting ? 'default' : 'danger',
      confirmLabel: isPromoting ? 'Make Admin' : 'Remove Admin',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    try {
      const res = await api.admin.users.setRole(user.uid, newRole);
      if (res.success) {
        showToast(`User role updated to ${newRole} successfully.`, 'success');
        fetchUsers(page);
        if (selectedUser?.id === user.id) {
          setSelectedUser({ ...user, role: newRole });
        }
      } else {
        showToast(res.message || 'Failed to update user role.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role.', 'error');
    }
  };

  const handleWalletAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !walletAmount || !walletPin) {
      showToast('Amount and PIN are required.', 'warning');
      return;
    }

    setWalletLoading(true);
    try {
      const res = await api.adminDashboard.wallet.adjust({
        userId: selectedUser.id,
        amount: Number(walletAmount),
        description: walletDesc.trim() || `Admin balance adjustment for ${selectedUser.fullName}`,
        pin: walletPin,
      });

      if (res.success) {
        showToast(`Wallet adjusted! New balance: ₦${res.data?.balance?.toLocaleString()}`, 'success');
        setWalletAmount('');
        setWalletDesc('');
        setWalletPin('');
        setShowWalletAdjust(false);
        fetchPaymentLogs(selectedUser.id, 1);
      } else {
        showToast(res.message || 'Balance adjustment failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Balance adjustment failed.', 'error');
    } finally {
      setWalletLoading(false);
    }
  };

  const changePaymentLogsPage = (newPage: number) => {
    if (!selectedUser) return;
    setPaymentLogsPage(newPage);
    fetchPaymentLogs(selectedUser.id, newPage);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex flex-col gap-6 select-none max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">User Management</h1>
          <p className="text-text-secondary text-xs mt-1">
            {total} registered users · Page {page} of {totalPages}
          </p>
        </div>
        <Badge label={`${total} total`} variant="info" />
      </div>

      <Card padded={false} className="overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-8 w-8 text-tint" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-text-secondary text-sm">
            No users found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => openUserDetail(user)}
                className="flex items-center p-4 hover:bg-bg-selected/10 transition-colors cursor-pointer gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-bg-element border border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-text-secondary">
                    {(user.fullName || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-text-main truncate">
                      {user.fullName || 'Unnamed User'}
                    </span>
                    {user.role === 'admin' && (
                      <Badge label="Admin" variant="warning" />
                    )}
                    {!user.isActive && (
                      <Badge label="Inactive" variant="error" />
                    )}
                  </div>
                  <span className="text-xs text-text-main font-semibold truncate">
                    {user.email}
                  </span>
                </div>
                <span className="text-xs text-text-secondary flex-shrink-0">
                  {new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs font-bold cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-xs font-bold text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs font-bold cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={closeUserDetail} />
          <Card
            padded={true}
            className="relative bg-card border border-border w-full max-w-md rounded-2xl flex flex-col gap-4 shadow-2xl animate-scale-up max-h-[85vh] overflow-hidden"
            style={{ borderRadius: 'var(--radius-xl)' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-bg-element border border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-text-secondary">
                    {(selectedUser.fullName || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <h3 className="text-lg font-bold text-text-main truncate">
                    {selectedUser.fullName || 'Unnamed User'}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      label={selectedUser.role}
                      variant={selectedUser.role === 'admin' ? 'warning' : 'default'}
                    />
                    {selectedUser.isActive ? (
                      <Badge label="Active" variant="success" />
                    ) : (
                      <Badge label="Inactive" variant="error" />
                    )}
                    {selectedUser.pinSetup && (
                      <Badge label="PIN Set" variant="info" />
                    )}
                  </div>
                </div>
              </div>

              {/* Kebab Menu */}
              <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-selected transition-colors cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-text-secondary">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-10 animate-scale-up"
                    style={{ borderRadius: 'var(--radius-lg)' }}
                  >
                    <button
                      onClick={() => handleMenuAction('wallet')}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-text-main hover:bg-bg-selected transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tint flex-shrink-0">
                        <path d="M21 12V7H5a2 2 0 010-4h14v4"/>
                        <path d="M3 5v14a2 2 0 002 2h16v-5"/>
                        <path d="M18 12a2 2 0 100 4 2 2 0 000-4z"/>
                      </svg>
                      Adjust Wallet
                    </button>
                    <button
                      onClick={() => handleMenuAction('toggle-status')}
                      disabled={togglingUserId === selectedUser.id}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-bg-selected transition-colors flex items-center gap-2.5 cursor-pointer disabled:opacity-50 ${
                        selectedUser.isActive ? 'text-error-val' : 'text-success'
                      }`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                        {selectedUser.isActive ? (
                          <>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                          </>
                        ) : (
                          <>
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="8 12 11 15 16 9"/>
                          </>
                        )}
                      </svg>
                      {togglingUserId === selectedUser.id
                        ? 'Updating...'
                        : selectedUser.isActive
                          ? 'Deactivate'
                          : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleMenuAction('toggle-role')}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-bg-selected transition-colors flex items-center gap-2.5 cursor-pointer ${
                        selectedUser.role === 'admin' ? 'text-error-val' : 'text-warning'
                      }`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      {selectedUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Info Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-3 border-y border-border">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Email</span>
                <span className="text-xs font-bold text-text-main select-all truncate">{selectedUser.email}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Phone</span>
                <span className="text-xs font-bold text-text-main select-all">{selectedUser.phoneNumber || '\u2014'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">User ID</span>
                <span className="text-xs font-bold text-text-main select-all truncate">{selectedUser.uid}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Wallet ID</span>
                <span className="text-xs font-bold text-text-main select-all truncate">{selectedUser.walletId}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Joined</span>
                <span className="text-xs font-bold text-text-main">
                  {new Date(selectedUser.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Status</span>
                <span className={`text-xs font-bold ${selectedUser.isActive ? 'text-success' : 'text-error-val'}`}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Wallet Adjust Form */}
            {showWalletAdjust && (
              <form onSubmit={handleWalletAdjust} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-tint rounded-full" />
                  <span className="text-sm font-bold text-text-main">Wallet Adjustment</span>
                </div>
                <Input
                  label="Amount (₦)"
                  placeholder="5000 to credit, -2000 to debit"
                  type="number"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  required
                  autoFocus
                />
                <Input
                  label="Reason"
                  placeholder="e.g. Compensation, manual top-up"
                  value={walletDesc}
                  onChange={(e) => setWalletDesc(e.target.value)}
                />
                <Input
                  label="Transaction PIN"
                  placeholder="4-digit PIN"
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  value={walletPin}
                  onChange={(e) => setWalletPin(e.target.value.replace(/\D/g, ''))}
                  required
                  autoComplete="new-password"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setShowWalletAdjust(false)}
                    className="cursor-pointer text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={walletLoading}
                    className="bg-accent hover:opacity-90 font-bold text-xs"
                  >
                    {walletLoading ? 'Adjusting...' : 'Adjust Balance'}
                  </Button>
                </div>
              </form>
            )}

            {/* Payment Logs */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-success rounded-full" />
                <span className="text-sm font-bold text-text-main">Payment History</span>
                <span className="text-[10px] text-text-secondary">
                  ({paymentLogsTotal} transaction{paymentLogsTotal !== 1 ? 's' : ''})
                </span>
              </div>

              {paymentLogsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <svg className="animate-spin h-5 w-5 text-tint" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : paymentLogs.length === 0 ? (
                <div className="text-center py-6 text-text-secondary text-xs">
                  No payment history for this user.
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-48">
                  {paymentLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-bg-element rounded-lg border border-border flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-success">
                          ₦{log.details.amount.toLocaleString()}
                        </span>
                        <Badge label="Top-up" variant="success" />
                      </div>
                      <div className="flex flex-col gap-0.5 text-[10px] text-text-secondary">
                        <span>Txn: {log.details.transactionId}</span>
                        <span>Source: {log.details.source}</span>
                        <span>{new Date(log.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {paymentLogsTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changePaymentLogsPage(Math.max(1, paymentLogsPage - 1))}
                    disabled={paymentLogsPage <= 1}
                    className="text-[10px] font-bold cursor-pointer"
                  >
                    Previous
                  </Button>
                  <span className="text-[10px] font-bold text-text-secondary">
                    {paymentLogsPage} / {paymentLogsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changePaymentLogsPage(Math.min(paymentLogsTotalPages, paymentLogsPage + 1))}
                    disabled={paymentLogsPage >= paymentLogsTotalPages}
                    className="text-[10px] font-bold cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-border pt-3">
              <Button
                variant="outline"
                size="md"
                onClick={closeUserDetail}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
