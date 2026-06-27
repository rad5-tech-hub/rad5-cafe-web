import React, { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
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
  const [total, setTotal] = useState(0);
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
          setTotal(res.total ?? res.data.length);
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
        showToast({ type: 'success', title: 'Expense Added', message: 'The business expense has been recorded successfully.' });
        setShowAddForm(false);
        setFormData({ amount: '', description: '', date: '', pin: '' });
        fetchExpenses(page);
      } else {
        showToast({ type: 'error', title: 'Failed to add expense', message: res.message || 'Error occurred.' });
      }
    } catch (error: any) {
      showToast({ type: 'error', title: 'Error', message: error.message || 'Failed to add expense.' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 dark:text-brand-100">
            Sales Ledger / Expenses
          </h1>
          <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
            Track business expenses manually deducted from revenue.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'primary'}>
          {showAddForm ? 'Cancel' : 'Add Expense'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-6 bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800">
          <h3 className="text-lg font-semibold mb-4">Record New Expense</h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-700 dark:text-brand-300">Amount (₦)</label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-700 dark:text-brand-300">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-brand-700 dark:text-brand-300">Description</label>
                <Input
                  placeholder="e.g. Purchased cleaning supplies"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-700 dark:text-brand-300">Admin PIN</label>
                <Input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={adding}>
                {adding ? 'Adding...' : 'Save Expense'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brand-500">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-brand-500">
            <p>No expenses found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-brand-500 uppercase bg-brand-50 dark:bg-brand-900/20 border-b border-brand-200 dark:border-brand-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 dark:divide-brand-800/50">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-brand-600 dark:text-brand-400">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {exp.description}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-red-600 dark:text-red-400">
                      -₦{(exp.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
