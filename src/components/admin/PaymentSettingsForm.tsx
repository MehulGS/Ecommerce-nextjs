'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Loader2, Save, Upload, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Settings {
  staticQrImageUrl?: string;
  upiId?: string;
  paymentInstructions?: string;
}

export default function PaymentSettingsForm({
  initialSettings,
}: {
  initialSettings: Settings | null;
}) {
  const [form, setForm] = useState<Settings>({
    staticQrImageUrl: initialSettings?.staticQrImageUrl ?? '',
    upiId: initialSettings?.upiId ?? '',
    paymentInstructions:
      initialSettings?.paymentInstructions ??
      'Scan the QR code to pay via UPI. Upload your payment screenshot after payment.',
  });

  const [saving, setSaving] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  // ── QR upload ──────────────────────────────────────────────────────────────

  const uploadQR = async (file: File) => {
    setQrUploading(true);
    setQrError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'qr');

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);

      setForm((f) => ({ ...f, staticQrImageUrl: data.url }));
      toast.success('QR image uploaded');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload QR image';
      setQrError(msg);
      toast.error(msg);
    } finally {
      setQrUploading(false);
    }
  };

  const removeQR = async () => {
    const currentUrl = form.staticQrImageUrl;
    if (!currentUrl) return;
    if (currentUrl.startsWith('/uploads/')) {
      try {
        await fetch('/api/admin/upload/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentUrl, category: 'qr' }),
        });
      } catch { /* non-fatal */ }
    }
    setForm((f) => ({ ...f, staticQrImageUrl: '' }));
    toast.success('QR image removed');
  };

  // ── Save settings ──────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // paymentMode is always static_qr — send it so the record stays consistent
        body: JSON.stringify({ ...form, paymentMode: 'static_qr' }),
      });
      if (res.ok) {
        toast.success('Payment settings saved');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to save settings');
      }
    } catch {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* QR image */}
      <div className="bg-white rounded-2xl p-6 shadow-soft space-y-5">
        <h2 className="font-semibold text-plum">UPI QR Code</h2>
        <p className="text-sm text-plum/60">
          Upload your UPI QR code image. Customers will scan this to pay. Download it from Google
          Pay, PhonePe, Paytm, or your bank&apos;s merchant portal.
        </p>

        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="w-36 h-36 rounded-xl overflow-hidden border-2 border-blush-200 flex items-center justify-center bg-blush-50 flex-shrink-0">
            {form.staticQrImageUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={form.staticQrImageUrl}
                  alt="UPI QR Code"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <span className="text-4xl">📱</span>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => qrFileRef.current?.click()}
              disabled={qrUploading}
              className="btn-secondary py-2.5 flex items-center gap-2"
            >
              {qrUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {form.staticQrImageUrl ? 'Replace QR' : 'Upload QR'}
            </button>

            {form.staticQrImageUrl && (
              <button
                type="button"
                onClick={removeQR}
                className="btn-secondary py-2.5 border-red-200 text-red-500 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove QR
              </button>
            )}

            <input
              ref={qrFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadQR(e.target.files[0])}
            />

            <p className="text-xs text-plum/40">PNG, JPG, or WebP · Max 3 MB</p>

            {qrError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{qrError}
              </p>
            )}
            {form.staticQrImageUrl && !qrUploading && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />QR image configured
              </p>
            )}
          </div>
        </div>
      </div>

      {/* UPI ID */}
      <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
        <h2 className="font-semibold text-plum">UPI Details</h2>

        <div>
          <label className="label" htmlFor="upiId">
            UPI ID <span className="text-plum/40 font-normal">(shown to customers as reference)</span>
          </label>
          <input
            id="upiId"
            type="text"
            value={form.upiId ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))}
            className="input-field"
            placeholder="yourname@upi"
          />
        </div>

        <div>
          <label className="label" htmlFor="paymentInstructions">Payment Instructions</label>
          <textarea
            id="paymentInstructions"
            value={form.paymentInstructions ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, paymentInstructions: e.target.value }))}
            className="input-field h-24 resize-none"
            placeholder="Step-by-step instructions shown to customers during checkout"
          />
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Manual Verification Required</p>
          <p className="mt-1">
            Customer screenshots are not proof of payment. Always verify the actual transaction in
            your bank app or UPI merchant account before confirming any order.
          </p>
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full py-4">
        {saving
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : <><Save className="w-5 h-5" />Save Payment Settings</>}
      </button>
    </form>
  );
}
