import React, { useState } from 'react';
import { GlassSheet } from '../ui/glass-panel';
import { Icon } from '../ui/icon';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddAdminModal: React.FC<AddAdminModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    isExisting: boolean;
    temporaryPassword?: string;
    email: string;
    fullName: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setEmail('');
    setFullName('');
    setPassword('');
    setResult(null);
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast({ type: 'warning', title: 'Valid email required', message: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    try {
      const res: any = await api.admin.users.addAdmin({
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        password: password.trim() || undefined,
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: res.isExisting ? 'User Promoted to Admin' : 'New Admin Account Created',
          message: res.message,
        });

        setResult({
          message: res.message,
          isExisting: !!res.isExisting,
          temporaryPassword: res.temporaryPassword || res.data?.temporaryPassword,
          email: email.trim(),
          fullName: fullName.trim() || res.data?.fullName || email.trim().split('@')[0],
        });

        onSuccess();
      } else {
        showToast({ type: 'error', title: 'Failed to add admin', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error adding admin', message: err.message || 'An error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    showToast({ type: 'info', title: 'Copied!', message: 'Temporary password copied to clipboard.' });
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <GlassSheet onClick={(e) => e.stopPropagation()} className="w-full max-w-md animate-rad5-pop">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-tint-a text-tint grid place-items-center flex-shrink-0">
              <Icon name="shield-check" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-text-main">Add Admin User</h2>
              <p className="text-xs text-text-secondary">Create an admin account or promote an existing user.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg grid place-items-center border border-border bg-card text-text-secondary hover:text-text-main transition-colors cursor-pointer"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {result ? (
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-ok/10 border border-ok/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-ok font-bold text-sm">
                <Icon name="check" size={16} />
                <span>{result.isExisting ? 'Existing Account Promoted' : 'New Admin Account Created'}</span>
              </div>
              <p className="text-text-main">{result.message}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-element border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary font-semibold">Email:</span>
                <span className="font-bold text-text-main">{result.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-semibold">Full Name:</span>
                <span className="font-bold text-text-main">{result.fullName}</span>
              </div>
              {result.temporaryPassword && (
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-text-secondary font-semibold block text-[11px]">Temporary Password:</span>
                    <code className="text-sm font-mono font-bold text-tint bg-tint-a px-2 py-0.5 rounded-md mt-0.5 inline-block">
                      {result.temporaryPassword}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyPassword(result.temporaryPassword!)}
                    className="px-3 py-1.5 rounded-lg bg-tint-dark text-white font-bold text-xs hover:bg-tint transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Icon name="copy" size={13} />
                    Copy
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-tint-dark text-white font-bold text-xs hover:bg-tint transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Email Address <span className="text-error-val">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg-element text-sm text-text-main outline-none focus:border-tint placeholder:text-text-secondary transition-colors"
              />
              <p className="text-[11px] text-text-secondary mt-1">
                If this email is not registered as a customer, a new admin account will be created automatically.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Full Name <span className="text-text-secondary font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg-element text-sm text-text-main outline-none focus:border-tint placeholder:text-text-secondary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Initial Password <span className="text-text-secondary font-normal">(Optional — auto-generates if blank)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for auto-generated password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg-element text-sm text-text-main outline-none focus:border-tint placeholder:text-text-secondary transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-border bg-card text-text-main text-xs font-bold hover:border-tint transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-tint-dark text-white font-bold text-xs hover:bg-tint transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Icon name="sync" size={14} className="animate-spin" /> : <Icon name="plus" size={14} />}
                Add Admin
              </button>
            </div>
          </form>
        )}
      </GlassSheet>
    </div>
  );
};
