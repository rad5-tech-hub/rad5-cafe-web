import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { api } from '~/lib/api';
import { Card } from '~/components/ui/card';
import { Icon } from '~/components/ui/icon';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { useToast } from '~/context/toast-context';

export function meta() {
  return [
    { title: "PIN Change Requests - RAD5 Café" },
    { name: "description", content: "Approve or reject customer transaction PIN change requests." },
  ];
}

type PinRequest = {
  id: string;
  userId: string;
  uid: string;
  email: string;
  fullName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: any;
  approvedAt?: any;
  approvedBy?: string;
  rejectedAt?: any;
  rejectedBy?: string;
  rejectReason?: string;
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

const formatDate = (val: any) => {
  try {
    const isoString = parseDate(val);
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown date';
  }
};

export default function AdminPinChanges() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<PinRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  // Modal actions
  const [actionRequest, setActionRequest] = useState<PinRequest | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null);
  const [confirmPin, setConfirmPin] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const limit = 15;

  const fetchRequests = useCallback((pageNum: number, status: string) => {
    setLoading(true);
    const queryStatus = status === 'ALL' ? undefined : status;
    api.admin.pinChanges.list({ status: queryStatus, page: pageNum, limit })
      .then((res: any) => {
        if (res.success) {
          setRequests(res.data ?? []);
          setTotal(res.total ?? 0);
          setPage(res.page ?? pageNum);
          setTotalPages(res.totalPages ?? 1);
        } else {
          showToast(res.message || 'Failed to load pin change requests.', 'error');
        }
      })
      .catch((err: any) => {
        showToast(err.message || 'Failed to load pin change requests.', 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    fetchRequests(1, statusFilter);
  }, [statusFilter, fetchRequests]);

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionRequest || !confirmPin.trim()) return;

    if (!/^\d{4}$/.test(confirmPin)) {
      showToast('PIN must be exactly 4 digits.', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.admin.pinChanges.approve(actionRequest.id, confirmPin.trim());
      if (res.success) {
        showToast('PIN change request approved and PIN updated successfully!', 'success');
        closeModal();
        fetchRequests(page, statusFilter);
      } else {
        showToast(res.message || 'Verification failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Verification failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionRequest) return;

    setActionLoading(true);
    try {
      const res = await api.admin.pinChanges.reject(actionRequest.id, rejectReason.trim() || undefined);
      if (res.success) {
        showToast('PIN change request rejected.', 'success');
        closeModal();
        fetchRequests(page, statusFilter);
      } else {
        showToast(res.message || 'Rejection failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Rejection failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setActionRequest(null);
    setModalType(null);
    setConfirmPin('');
    setRejectReason('');
  };

  const getStatusBadge = (status: PinRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge label="Pending Approval" variant="warning" />;
      case 'APPROVED':
        return <Badge label="Approved" variant="success" />;
      case 'REJECTED':
        return <Badge label="Rejected" variant="error" />;
      default:
        return <Badge label={status} />;
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none max-w-4xl mx-auto w-full">
      {/* Header and navigation */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-bg-element border border-border hover:bg-bg-selected text-text-secondary hover:text-text-main transition-colors cursor-pointer"
          >
            <Icon name="chevron-left" size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-text-main tracking-tight">PIN Change Requests</h1>
            <p className="text-text-secondary text-xs mt-1">
              Verify and authorize customer transaction PIN change overrides.
            </p>
          </div>
        </div>

        {/* Filter Selection */}
        <div className="flex gap-1.5 p-1 bg-bg-element border border-border rounded-xl self-start md:self-auto">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setPage(1);
                setStatusFilter(status);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                statusFilter === status
                  ? 'bg-tint text-white'
                  : 'text-text-secondary hover:text-text-main'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Request list grid */}
      <Card padded={false} className="flex flex-col overflow-hidden shadow-xs">
        {loading ? (
          // Shimmer loading lines
          <div className="flex flex-col divide-y divide-border/60">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-border" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-32 bg-border rounded-md" />
                    <div className="h-3 w-44 bg-border rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-20 bg-border rounded-lg" />
                  <div className="h-8 w-20 bg-border rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 px-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-bg-selected flex items-center justify-center text-text-secondary">
              <Icon name="lock" size={22} />
            </div>
            <h3 className="font-bold text-sm text-text-main">No requests found</h3>
            <p className="text-xs text-text-secondary max-w-xs leading-normal">
              There are currently no PIN change requests matching the "{statusFilter.toLowerCase()}" filter.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {requests.map((req) => {
              const userInitials = req.fullName
                ? req.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : req.email ? req.email.slice(0, 2).toUpperCase() : '?';

              return (
                <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3.5">
                    {/* User profile bubble */}
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold bg-tint shrink-0 shadow-xs select-none">
                      {userInitials}
                    </div>
                    {/* User info */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-text-main">
                          {req.fullName || 'Unknown Customer'}
                        </span>
                        <Badge label={req.uid} variant="default" className="text-[10px] font-mono px-2 py-0.5" />
                        {getStatusBadge(req.status)}
                      </div>
                      <span className="text-xs text-text-secondary font-medium">{req.email}</span>
                      <span className="text-[10px] text-text-secondary mt-1">
                        Requested: {formatDate(req.requestedAt)}
                      </span>

                      {/* Approval details info */}
                      {req.status === 'APPROVED' && (
                        <span className="text-[10px] text-success font-semibold mt-1">
                          Approved at {formatDate(req.approvedAt)}
                        </span>
                      )}

                      {/* Rejection reason info */}
                      {req.status === 'REJECTED' && (
                        <div className="mt-1 flex flex-col gap-0.5 text-[10px]">
                          <span className="text-error-val font-semibold">
                            Rejected at {formatDate(req.rejectedAt)}
                          </span>
                          {req.rejectReason && (
                            <span className="text-text-secondary italic">
                              Reason: "{req.rejectReason}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for PENDING requests */}
                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActionRequest(req);
                          setModalType('reject');
                        }}
                        className="text-xs font-bold border-error-val/30 hover:bg-error-val/10 text-error-val cursor-pointer"
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setActionRequest(req);
                          setModalType('approve');
                        }}
                        className="text-xs font-bold cursor-pointer"
                      >
                        Approve Change
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-2 select-none">
          <span className="text-xs text-text-secondary font-medium">
            Page {page} of {totalPages} ({total} total requests)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => fetchRequests(page - 1, statusFilter)}
              className="text-xs font-bold cursor-pointer"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => fetchRequests(page + 1, statusFilter)}
              className="text-xs font-bold cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Action Modals */}
      {/* 1. Approve modal */}
      <Modal
        isOpen={modalType === 'approve'}
        onClose={closeModal}
        title="Approve PIN Change Request"
      >
        <form onSubmit={handleApproveSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-text-secondary leading-normal">
              To verify and authorize this PIN change, you must enter the exact 4-digit preferred PIN requested by the user. Once approved, their active transaction PIN will be updated immediately.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Verify Preferred PIN
            </label>
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="Enter user's preferred PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={actionLoading}
              className="cursor-pointer font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={actionLoading || confirmPin.length !== 4}
              className="cursor-pointer font-bold"
            >
              {actionLoading ? 'Verifying & Saving...' : 'Approve & Update'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Reject modal */}
      <Modal
        isOpen={modalType === 'reject'}
        onClose={closeModal}
        title="Reject PIN Change Request"
      >
        <form onSubmit={handleRejectSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-text-secondary leading-normal">
              Are you sure you want to reject this transaction PIN change request? You can optionally supply a reason below to notify the customer.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Rejection Reason (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Request details could not be verified"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={actionLoading}
              className="cursor-pointer font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={actionLoading}
              className="cursor-pointer font-bold bg-error-val hover:bg-error-val-hover text-white border-none"
            >
              {actionLoading ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
