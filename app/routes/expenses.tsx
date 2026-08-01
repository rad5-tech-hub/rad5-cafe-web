import React, { useState, useEffect } from 'react';
import { GlassPanel } from '~/components/ui/glass-panel';
import { Money } from '~/components/ui/money';
import { Icon } from '~/components/ui/icon';
import { DataTable, type DataTableColumn } from '~/components/ui/data-table';
import { SheetField } from '~/components/ui/action-sheet-modal';
import { PillButton } from '~/components/ui/pill-button';
import { useToast } from '~/context/toast-context';
import { api } from '~/lib/api';

export function meta() {
  return [
    { title: "Sales Ledger / Expenses - RAD5 Café" },
    { name: "description", content: "Manage business expenses and sales ledger." },
  ];
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export default function Expenses() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ amount: '', description: '', date: '', pin: '' });

  const fetchExpenses = (pageNum: number) => {
    setLoading(true);
    api.adminDashboard.salesLedger?.getExpenses?.({ page: pageNum, limit })
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) {
          setExpenses(res.data);
          setTotalPages(res.totalPages ?? Math.ceil((res.total ?? res.data.length) / limit));
        } else {
          setExpenses([]);
        }
      })
      .catch((err: any) => {
        console.warn('Could not load expenses:', err);
        setExpenses([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExpenses(page);
  }, [page]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.date || !formData.pin) return;

    setAdding(true);
    try {
      const res = await api.adminDashboard.salesLedger.addExpense({
        amount: Number(formData.amount),
        description: formData.description,
        date: formData.date,
        pin: formData.pin,
      });

      if (res.success) {
        showToast({ type: 'success', title: 'Expense added', message: 'The business expense has been recorded successfully.' });
        setShowAddForm(false);
        setFormData({ amount: '', description: '', date: '', pin: '' });
        fetchExpenses(page);
      } else {
        showToast({ type: 'error', title: 'Failed to add expense', message: res.message });
      }
    } catch (error: any) {
      showToast({ type: 'error', title: 'Failed to add expense', message: error.message });
    } finally {
      setAdding(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const columns: DataTableColumn<Expense>[] = [
    { key: 'date', header: 'Date', render: (e) => <span className="text-[12.5px] text-text-secondary">{new Date(e.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span> },
    { key: 'description', header: 'Description', width: '1.8fr', render: (e) => <span className="text-[13px] font-semibold truncate block">{e.description}</span> },
    { key: 'amount', header: 'Amount', align: 'right', render: (e) => <Money amount={-Math.abs(e.amount || 0)} showSign className="text-[13px] font-semibold text-err" /> },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sales ledger / expenses</h1>
          <p className="text-text-secondary text-xs mt-1">Track business expenses manually deducted from revenue.</p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className={`px-4 py-2.5 rounded-xl text-[13.5px] font-bold cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            showAddForm ? 'border border-border bg-card hover:border-tint hover:text-tint' : 'border-none bg-tint-dark text-white hover:bg-tint'
          }`}
        >
          <Icon name={showAddForm ? 'x' : 'plus'} size={14} />
          {showAddForm ? 'Cancel' : 'Add expense'}
        </button>
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="glass-surface rounded-2xl p-5">
          <div className="text-[12.5px] font-semibold text-text-secondary">Total recorded</div>
          <Money amount={totalExpenses} className="font-money text-[25px] font-semibold tracking-tight mt-2 block text-err" />
          <div className="text-xs text-text-secondary mt-1">{expenses.length} expenses on this page</div>
        </div>
      </div>

      {showAddForm && (
        <GlassPanel radius="lg">
          <h3 className="text-[15px] font-bold mb-3.5">Record new expense</h3>
          <form onSubmit={handleAddExpense} className="flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3">
              <SheetField label="Amount (₦)" value={formData.amount} onChange={(v) => setFormData({ ...formData, amount: v })} type="number" mono placeholder="e.g. 5000" required />
              <SheetField label="Date" value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} type="date" required />
              <div className="md:col-span-2">
                <SheetField label="Description" value={formData.description} onChange={(v) => setFormData({ ...formData, description: v })} placeholder="e.g. Purchased cleaning supplies" required />
              </div>
              <SheetField label="Admin PIN" value={formData.pin} onChange={(v) => setFormData({ ...formData, pin: v.replace(/\D/g, '') })} type="password" mono maxLength={4} placeholder="4-digit PIN" required />
            </div>
            <div className="flex justify-end mt-4">
              <button type="submit" disabled={adding} className="px-4 py-2.5 rounded-xl border-none bg-tint-dark text-white text-sm font-bold cursor-pointer hover:bg-tint disabled:opacity-50 transition-colors">
                {adding ? 'Adding…' : 'Save expense'}
              </button>
            </div>
          </form>
        </GlassPanel>
      )}

      <DataTable
        columns={columns}
        rows={expenses}
        keyExtractor={(e) => e.id}
        loading={loading}
        emptyMessage="No expenses found."
        minWidth={520}
      />

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <PillButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</PillButton>
          <span className="text-xs font-bold text-text-secondary">Page {page} of {totalPages}</span>
          <PillButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PillButton>
        </div>
      )}
    </div>
  );
}
