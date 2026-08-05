import React, { useState, useEffect, useCallback } from 'react';
import { GlassSheet } from '~/components/ui/glass-panel';
import { Icon } from '~/components/ui/icon';
import { IconButton } from '~/components/ui/icon-button';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { AddAdminModal, type PermissionOption } from '~/components/modals/add-admin-modal';
import { useToast } from '~/context/toast-context';
import { useConfirm } from '~/context/confirm-context';
import { api } from '~/lib/api';

type AdminRow = {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  isActive: boolean;
  fullAccess: boolean;
  permissions: string[];
  createdAt: string;
};

function StatusChip({ label, tone }: { label: string; tone: string }) {
  return <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-tint-a ${tone}`}>{label}</span>;
}

export function meta() {
  return [
    { title: "Manage Admins - RAD5 Café" },
    { name: "description", content: "Create sub-admin accounts and control which console sections they can see." },
  ];
}

export default function ManageAdmins() {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionOptions, setPermissionOptions] = useState<PermissionOption[]>([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminRow | null>(null);
  const [editFullAccess, setEditFullAccess] = useState(false);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const fetchAdmins = useCallback(() => {
    setLoading(true);
    api.admin.users.listAdmins()
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) setAdmins(res.data);
      })
      .catch((err: any) => {
        showToast({ type: 'error', title: 'Could not load admins', message: err.message });
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    fetchAdmins();
    api.admin.permissions.list().then((res: any) => {
      if (res.success && Array.isArray(res.data)) setPermissionOptions(res.data);
    }).catch(() => {});
  }, [fetchAdmins]);

  const openEdit = (admin: AdminRow) => {
    setEditingAdmin(admin);
    setEditFullAccess(admin.fullAccess);
    setEditPermissions(admin.permissions || []);
  };

  const closeEdit = () => setEditingAdmin(null);

  const togglePermission = (key: string) => {
    setEditPermissions((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleSavePermissions = async () => {
    if (!editingAdmin) return;
    setSavingPermissions(true);
    try {
      const res: any = await api.admin.users.updatePermissions(editingAdmin.id, {
        fullAccess: editFullAccess,
        permissions: editPermissions,
      });
      if (res.success) {
        showToast({ type: 'success', title: 'Permissions updated' });
        closeEdit();
        fetchAdmins();
      } else {
        showToast({ type: 'error', title: 'Failed to update permissions', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update permissions', message: err.message });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleRevokeAdmin = async (admin: AdminRow) => {
    const confirmed = await showConfirm({
      title: 'Remove admin',
      message: `Are you sure you want to remove admin privileges from ${admin.fullName || admin.email}? They will become a regular customer account.`,
      variant: 'danger',
      confirmLabel: 'Remove admin',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    try {
      const res: any = await api.admin.users.setRole(admin.uid, 'customer');
      if (res.success) {
        showToast({ type: 'success', title: 'Admin removed' });
        fetchAdmins();
      } else {
        showToast({ type: 'error', title: 'Failed to remove admin', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to remove admin', message: err.message });
    }
  };

  const columns: DataTableColumn<AdminRow>[] = [
    {
      key: 'admin', header: 'Admin', width: '1.8fr',
      render: (a) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-tint-b text-tint grid place-items-center flex-shrink-0 text-xs font-bold">
            {(a.fullName || a.email)[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{a.fullName || a.email}</div>
            <div className="text-[11px] text-text-secondary truncate">{a.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'access', header: 'Access', width: '1.6fr',
      render: (a) => (
        a.fullAccess
          ? <StatusChip label="Full access" tone="text-warn" />
          : a.permissions.length === 0
            ? <StatusChip label="No sections yet" tone="text-err" />
            : <span className="text-[11px] text-text-secondary">{a.permissions.length} section{a.permissions.length !== 1 ? 's' : ''}</span>
      ),
    },
    {
      key: 'status', header: 'Status', width: '1fr',
      render: (a) => <StatusChip label={a.isActive ? 'Active' : 'Inactive'} tone={a.isActive ? 'text-ok' : 'text-err'} />,
    },
    {
      key: 'actions', header: '', width: '1fr', align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <IconButton icon="edit" size={36} iconSize={14} title="Edit permissions" onClick={() => openEdit(a)} />
          <IconButton icon="trash" size={36} iconSize={14} title="Remove admin" onClick={() => handleRevokeAdmin(a)} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="sticky top-0 z-30 py-3 -my-2 bg-bg-page/90 backdrop-blur-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Manage admins</h1>
          <p className="text-text-secondary text-xs mt-1">Create sub-admins and control which console sections each one can see.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddAdminModal(true)}
          className="px-4 py-2.5 rounded-xl border-none bg-tint-dark text-white text-xs font-bold cursor-pointer hover:bg-tint transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Icon name="plus" size={14} />
          Add Admin
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={admins}
        keyExtractor={(a) => a.id}
        loading={loading}
        emptyMessage="No admins found."
        minWidth={620}
      />

      {editingAdmin && (
        <div onClick={closeEdit} className="fixed inset-0 z-50 grid place-items-center p-5" style={{ background: 'rgba(17,24,39,0.4)', backdropFilter: 'blur(6px)' }}>
          <GlassSheet onClick={(e) => e.stopPropagation()} className="w-full max-w-md animate-rad5-pop max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold truncate">{editingAdmin.fullName || editingAdmin.email}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{editingAdmin.email}</p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="w-8 h-8 rounded-lg grid place-items-center border border-border bg-card text-text-secondary hover:text-text-main transition-colors cursor-pointer flex-shrink-0"
              >
                <Icon name="x" size={15} />
              </button>
            </div>

            <div className="py-4 flex flex-col gap-3.5">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-bg-element cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFullAccess}
                  onChange={(e) => setEditFullAccess(e.target.checked)}
                  className="mt-0.5 accent-tint"
                />
                <span>
                  <span className="block text-sm font-bold">Full access</span>
                  <span className="block text-[11px] text-text-secondary mt-0.5">Sees every console section, same as the highest-tier admins. Overrides the checkboxes below.</span>
                </span>
              </label>

              <div className={editFullAccess ? 'opacity-40 pointer-events-none' : ''}>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Console sections</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto p-2.5 rounded-xl border border-border bg-bg-element">
                  {permissionOptions.map((p) => (
                    <label key={p.key} className="flex items-start gap-2 text-xs cursor-pointer p-1.5 rounded-lg hover:bg-tint-a transition-colors">
                      <input
                        type="checkbox"
                        checked={editPermissions.includes(p.key)}
                        onChange={() => togglePermission(p.key)}
                        className="mt-0.5 accent-tint"
                      />
                      <span className="font-semibold text-text-main">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-border">
              <button
                type="button"
                onClick={closeEdit}
                className="px-4 py-2.5 rounded-xl border border-border bg-card text-text-main text-xs font-bold hover:border-tint transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={savingPermissions}
                className="px-5 py-2.5 rounded-xl bg-tint-dark text-white font-bold text-xs hover:bg-tint transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingPermissions ? 'Saving…' : 'Save access'}
              </button>
            </div>
          </GlassSheet>
        </div>
      )}

      <AddAdminModal
        isOpen={showAddAdminModal}
        onClose={() => setShowAddAdminModal(false)}
        onSuccess={() => fetchAdmins()}
        permissionOptions={permissionOptions}
      />
    </div>
  );
}
