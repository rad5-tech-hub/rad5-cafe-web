import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { api } from '~/lib/api';
import { Icon } from '~/components/ui/icon';
import { PillButton } from '~/components/ui/pill-button';
import { IconButton } from '~/components/ui/icon-button';
import { ActionSheetModal, SheetField } from '~/components/ui/action-sheet-modal';
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
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Unknown date';
  }
};

function StatusChip({ status }: { status: PinRequest['status'] }) {
  const map: Record<PinRequest['status'], { label: string; tone: string }> = {
    PENDING: { label: 'Pending approval', tone: 'text-warn' },
    APPROVED: { label: 'Approved', tone: 'text-ok' },
    REJECTED: { label: 'Rejected', tone: 'text-err' },
  };
  const conf = map[status] ?? { label: status, tone: 'text-tint' };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-tint-a ${conf.tone}`}>{conf.label}</span>;
}

export default function AdminPinChanges() {
  const { showToast } = useToast();

  const [requests, setRequests] = useState<PinRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

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
          showToast({ type: 'error', title: 'Failed to load PIN change requests', message: res.message });
        }
      })
      .catch((err: any) => {
        showToast({ type: 'error', title: 'Failed to load PIN change requests', message: err.message });
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
      showToast({ type: 'warning', title: 'PIN must be exactly 4 digits.' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.admin.pinChanges.approve(actionRequest.id, confirmPin.trim());
      if (res.success) {
        showToast({ type: 'success', title: 'PIN change approved', message: 'PIN updated successfully.' });
        closeModal();
        fetchRequests(page, statusFilter);
      } else {
        showToast({ type: 'error', title: 'Verification failed', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Verification failed', message: err.message });
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
        showToast({ type: 'success', title: 'PIN change request rejected' });
        closeModal();
        fetchRequests(page, statusFilter);
      } else {
        showToast({ type: 'error', title: 'Rejection failed', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Rejection failed', message: err.message });
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

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="w-9 h-9 rounded-xl glass-surface grid place-items-center cursor-pointer hover:border-tint hover:text-tint transition-colors flex-shrink-0">
            <Icon name="chevron-left" size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">PIN change requests</h1>
            <p className="text-text-secondary text-xs mt-1">Verify and authorize customer transaction PIN change overrides.</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
            <PillButton key={status} active={statusFilter === status} onClick={() => { setPage(1); setStatusFilter(status); }}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </PillButton>
          ))}
        </div>
      </div>

      <div className="glass-surface rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 flex items-center gap-3.5 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-border" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-4 w-32 bg-border rounded-md" />
                  <div className="h-3 w-44 bg-border rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 px-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-tint-a grid place-items-center text-text-secondary">
              <Icon name="lock" size={22} />
            </div>
            <h3 className="font-bold text-sm">No requests found</h3>
            <p className="text-xs text-text-secondary max-w-xs leading-normal">
              There are currently no PIN change requests matching the "{statusFilter.toLowerCase()}" filter.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {requests.map((req) => {
              const userInitials = req.fullName
                ? req.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : req.email ? req.email.slice(0, 2).toUpperCase() : '?';

              return (
                <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full grid place-items-center text-white text-base font-bold bg-tint-dark flex-shrink-0">
                      {userInitials}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm truncate">{req.fullName || 'Unknown Customer'}</span>
                        <span className="text-[10px] font-mono text-text-secondary bg-tint-a px-2 py-0.5 rounded-full">{req.uid}</span>
                        <StatusChip status={req.status} />
                      </div>
                      <span className="text-xs text-text-secondary font-medium truncate">{req.email}</span>
                      <span className="text-[10px] text-text-secondary mt-1">Requested: {formatDate(req.requestedAt)}</span>

                      {req.status === 'APPROVED' && (
                        <span className="text-[10px] text-ok font-semibold mt-1">Approved at {formatDate(req.approvedAt)}</span>
                      )}
                      {req.status === 'REJECTED' && (
                        <div className="mt-1 flex flex-col gap-0.5 text-[10px]">
                          <span className="text-err font-semibold">Rejected at {formatDate(req.rejectedAt)}</span>
                          {req.rejectReason && <span className="text-text-secondary italic">Reason: "{req.rejectReason}"</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-1.5 self-end md:self-auto flex-shrink-0">
                      <IconButton icon="x" size={36} iconSize={14} title="Reject" onClick={() => { setActionRequest(req); setModalType('reject'); }} />
                      <IconButton icon="check" size={36} iconSize={14} variant="solid" title="Approve" onClick={() => { setActionRequest(req); setModalType('approve'); }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-secondary font-medium">Page {page} of {totalPages} ({total} total requests)</span>
          <div className="flex gap-2">
            <PillButton disabled={page === 1} onClick={() => fetchRequests(page - 1, statusFilter)}>Previous</PillButton>
            <PillButton disabled={page === totalPages} onClick={() => fetchRequests(page + 1, statusFilter)}>Next</PillButton>
          </div>
        </div>
      )}

      <ActionSheetModal
        isOpen={modalType === 'approve'}
        onClose={closeModal}
        title="Approve PIN change request"
        subtitle="To verify and authorize this PIN change, enter the exact 4-digit preferred PIN requested by the user. Once approved, their active transaction PIN updates immediately."
        onSubmit={handleApproveSubmit}
        submitLabel="Approve & update"
        loading={actionLoading}
        loadingLabel="Verifying & saving…"
        submitDisabled={confirmPin.length !== 4}
      >
        <SheetField label="Verify preferred PIN" value={confirmPin} onChange={(v) => setConfirmPin(v.replace(/\D/g, ''))} type="password" mono maxLength={4} placeholder="Enter user's preferred PIN" required autoFocus />
      </ActionSheetModal>

      <ActionSheetModal
        isOpen={modalType === 'reject'}
        onClose={closeModal}
        title="Reject PIN change request"
        subtitle="Are you sure you want to reject this transaction PIN change request? You can optionally supply a reason to notify the customer."
        onSubmit={handleRejectSubmit}
        submitLabel="Reject request"
        submitVariant="danger"
        loading={actionLoading}
        loadingLabel="Rejecting…"
      >
        <SheetField label="Rejection reason (optional)" value={rejectReason} onChange={setRejectReason} placeholder="e.g. Request details could not be verified" autoFocus />
      </ActionSheetModal>
    </div>
  );
}
