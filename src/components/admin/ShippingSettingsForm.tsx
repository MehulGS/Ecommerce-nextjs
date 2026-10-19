'use client';

import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Settings {
  freeShippingThreshold: number;
  standardShippingCharge: number;
  expressShippingCharge: number;
  estimatedDeliveryDays: string;
}

export default function ShippingSettingsForm({ initialSettings }: { initialSettings: Settings | null }) {
  const [form, setForm] = useState({
    freeShippingThreshold: initialSettings?.freeShippingThreshold ?? 999,
    standardShippingCharge: initialSettings?.standardShippingCharge ?? 79,
    expressShippingCharge: initialSettings?.expressShippingCharge ?? 149,
    estimatedDeliveryDays: initialSettings?.estimatedDeliveryDays ?? '5-7 business days',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) toast.success('Shipping settings saved!');
      else toast.error('Failed to save');
    } catch {
      toast.error('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-soft space-y-5">
        <h2 className="font-semibold text-plum">Shipping Charges</h2>

        <div>
          <label className="label">Free Shipping Threshold (₹)</label>
          <input
            type="number"
            value={form.freeShippingThreshold}
            onChange={(e) => setForm((f) => ({ ...f, freeShippingThreshold: Number(e.target.value) }))}
            className="input-field"
            min="0"
          />
          <p className="text-xs text-plum/50 mt-1">Orders above this amount get free shipping</p>
        </div>

        <div>
          <label className="label">Standard Shipping Charge (₹)</label>
          <input
            type="number"
            value={form.standardShippingCharge}
            onChange={(e) => setForm((f) => ({ ...f, standardShippingCharge: Number(e.target.value) }))}
            className="input-field"
            min="0"
          />
        </div>

        <div>
          <label className="label">Express Shipping Charge (₹)</label>
          <input
            type="number"
            value={form.expressShippingCharge}
            onChange={(e) => setForm((f) => ({ ...f, expressShippingCharge: Number(e.target.value) }))}
            className="input-field"
            min="0"
          />
        </div>

        <div>
          <label className="label">Estimated Delivery Time</label>
          <input
            type="text"
            value={form.estimatedDeliveryDays}
            onChange={(e) => setForm((f) => ({ ...f, estimatedDeliveryDays: e.target.value }))}
            className="input-field"
            placeholder="5-7 business days"
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-4">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Shipping Settings</>}
      </button>
    </form>
  );
}
