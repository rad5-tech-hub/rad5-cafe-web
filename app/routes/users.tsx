import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
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
      } else {
        showToast(res.message || 'Failed to update user status.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status.', 'error');
    } finally {
      setTogglingUserId(null);
    }
  };

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
              <div key={user.id} className="flex flex-col md:flex-row md:justify-between md:items-center p-4 hover:bg-bg-selected/10 transition-colors gap-3">
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-text-main select-all">
                      {user.fullName || 'Unnamed User'}
                    </span>
                    <Badge
                      label={user.role}
                      variant={user.role === 'admin' ? 'warning' : 'default'}
                    />
                    {user.isActive ? (
                      <Badge label="Active" variant="success" />
                    ) : (
                      <Badge label="Inactive" variant="error" />
                    )}
                    {user.pinSetup && (
                      <Badge label="PIN Set" variant="info" />
                    )}
                  </div>
                  <span className="text-xs text-text-main font-semibold select-all">
                    {user.email}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-text-secondary flex-wrap">
                    <span>UID: {user.uid}</span>
                    <span>Wallet: {user.walletId}</span>
                    {user.phoneNumber && <span>Phone: {user.phoneNumber}</span>}
                    <span>Joined: {new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(user)}
                    disabled={togglingUserId === user.id}
                    className={`text-[10px] font-bold cursor-pointer ${
                      user.isActive
                        ? 'text-error-val border-error-val/30 hover:bg-error-val/10'
                        : 'text-success border-success/30 hover:bg-success/10'
                    }`}
                  >
                    {togglingUserId === user.id
                      ? 'Updating...'
                      : user.isActive
                        ? 'Deactivate'
                        : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
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
    </div>
  );
}
