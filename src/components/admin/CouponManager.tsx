'use client';

import React, { useState } from 'react';
import { Plus, Trash2, X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  description?: string;
}

export default function CouponManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    validUntil: '',
    description: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('create');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          type: form.type,
          value: parseFloat(form.value),
          minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
          maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : undefined,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
          validUntil: form.validUntil || undefined,
          description: form.description || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Coupon created!');
        setCoupons((prev) => [data.coupon, ...prev]);
        setShowForm(false);
        setForm({ code: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscountAmount: '', usageLimit: '', validUntil: '', description: '' });
      } else {
        toast.error(data.error ?? 'Failed to create coupon');
      }
    } catch {
      toast.error('Error creating coupon');
    } finally {
      setLoading(null);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    setLoading(coupon._id);
    try {
      await fetch(`/api/admin/coupons/${coupon._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      setCoupons((prev) => prev.map((c) => c._id === coupon._id ? { ...c, isActive: !c.isActive } : c));
      router.refresh();
    } catch {
      toast.error('Error updating coupon');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-5 shadow-soft border border-blush-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-plum">Create Coupon</h3>
            <button type="button" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="input-field font-mono uppercase"
                placeholder="SAVE20"
                required
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="input-field"
                placeholder="20% off on all orders"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}
                className="input-field"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="label">Value *</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className="input-field"
                placeholder={form.type === 'percentage' ? '20' : '50'}
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Min Order (₹)</label>
              <input type="number" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} className="input-field" placeholder="499" min="0" />
            </div>
            <div>
              <label className="label">Max Discount (₹)</label>
              <input type="number" value={form.maxDiscountAmount} onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))} className="input-field" placeholder="100" min="0" />
            </div>
            <div>
              <label className="label">Usage Limit</label>
              <input type="number" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} className="input-field" placeholder="100" min="1" />
            </div>
          </div>

          <div>
            <label className="label">Valid Until (optional)</label>
            <input type="datetime-local" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} className="input-field" />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={loading === 'create'} className="btn-primary py-2.5 flex-1">
              {loading === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create Coupon
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-2.5">Cancel</button>
          </div>
        </form>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-soft border border-blush-50 overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-8 text-center text-plum/40">No coupons yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blush-50 text-plum/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Discount</th>
                  <th className="text-left px-5 py-3">Min Order</th>
                  <th className="text-left px-5 py-3">Used</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-50">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-blush-50">
                    <td className="px-5 py-3">
                      <p className="font-mono font-bold text-plum">{coupon.code}</p>
                      {coupon.description && <p className="text-xs text-plum/40">{coupon.description}</p>}
                    </td>
                    <td className="px-5 py-3 font-medium text-plum">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                    </td>
                    <td className="px-5 py-3 text-plum/60">
                      {coupon.minOrderAmount ? formatCurrency(coupon.minOrderAmount) : '—'}
                    </td>
                    <td className="px-5 py-3 text-plum/60">
                      {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge text-xs ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(coupon)}
                        disabled={loading === coupon._id}
                        className="text-sm text-blush-500 hover:text-blush-600"
                      >
                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
