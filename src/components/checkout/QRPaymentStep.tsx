'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CreatedOrder {
  orderId: string;
  orderNumber: string;
  total: number;
  storeSettings?: {
    staticQrImageUrl?: string;
    paymentInstructions?: string;
    upiId?: string;
  };
}

interface QRPaymentStepProps {
  order: CreatedOrder;
  onSuccess: () => void;
}

export default function QRPaymentStep({ order, onSuccess }: QRPaymentStepProps) {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [upiRef, setUpiRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic client-side validation (server validates via magic bytes)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5 MB');
      return;
    }

    setProofFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async () => {
    if (!proofFile) {
      toast.error('Please upload your payment screenshot first');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderId', order.orderId);
      formData.append('proof', proofFile);
      if (upiRef.trim()) {
        formData.append('upiRef', upiRef.trim());
      }

      const res = await fetch('/api/payments/qr-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to submit payment proof');
        return;
      }

      setSubmitted(true);
      // Clean up blob URL
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      toast.success("Payment proof submitted! We'll verify and confirm your order shortly.");
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submitted state ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="container-narrow py-20 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="font-serif text-3xl text-plum mb-3">Thank you for your order!</h1>
        <p className="text-plum/60 mb-2">
          Order Number: <span className="font-semibold text-plum">{order.orderNumber}</span>
        </p>
        <p className="text-plum/60 mb-6">
          Your payment proof has been submitted. We&apos;ll verify your payment and confirm your
          order within 24 hours. You&apos;ll be notified on the email you provided.
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-sm text-amber-700">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          Your order will only be processed after our team verifies your payment in our bank/UPI
          records.
        </div>
        <button onClick={onSuccess} className="btn-primary">
          View Order Status
        </button>
      </div>
    );
  }

  // ── Main QR payment step ─────────────────────────────────────────────────────

  const settings = order.storeSettings;

  return (
    <div className="container-narrow py-10">
      <h1 className="font-serif text-3xl font-semibold text-plum text-center mb-8">
        Complete Your Payment
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: QR code display */}
        <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
          <h2 className="font-serif text-xl font-semibold text-plum mb-2">Scan &amp; Pay</h2>
          <p className="text-plum/60 text-sm mb-6">
            Scan the QR code below with any UPI app (GPay, PhonePe, Paytm, BHIM…)
          </p>

          {settings?.staticQrImageUrl ? (
            <div className="relative w-56 h-56 mx-auto mb-4 rounded-xl overflow-hidden border-4 border-blush-100">
              <Image
                src={settings.staticQrImageUrl}
                alt="Payment QR Code"
                fill
                className="object-contain"
                unoptimized
                priority
              />
            </div>
          ) : (
            <div className="w-56 h-56 mx-auto mb-4 rounded-xl bg-blush-50 flex items-center justify-center border-2 border-dashed border-blush-200">
              <div className="text-center p-4">
                <span className="text-5xl block mb-2">📱</span>
                <p className="text-sm text-plum/50">
                  QR code not configured yet.
                  <br />
                  <span className="text-xs">Admin: add a QR in Payment Settings.</span>
                </p>
              </div>
            </div>
          )}

          {settings?.upiId && (
            <p className="text-sm text-plum/60 mb-2">
              UPI ID: <span className="font-semibold text-plum">{settings.upiId}</span>
            </p>
          )}

          <div className="bg-blush-50 rounded-xl p-4 mt-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-plum/60">Order Number</span>
              <span className="font-semibold text-plum">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-plum/60">Amount to Pay</span>
              <span className="font-bold text-lg text-plum">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {settings?.paymentInstructions && (
            <div className="mt-4 text-sm text-plum/60 text-left leading-relaxed whitespace-pre-wrap">
              {settings.paymentInstructions}
            </div>
          )}
        </div>

        {/* Right: Upload proof */}
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <h2 className="font-serif text-xl font-semibold text-plum mb-2">Upload Payment Proof</h2>
          <p className="text-plum/60 text-sm mb-5">
            After paying, upload a screenshot of your successful transaction
          </p>

          {/* Steps */}
          <ol className="space-y-2 mb-6 text-sm text-plum/70">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blush-100 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </span>
              Scan the QR with your UPI app
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blush-100 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </span>
              Pay exactly {formatCurrency(order.total)}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blush-100 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </span>
              Take a screenshot of the payment confirmation screen
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blush-100 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                4
              </span>
              Upload the screenshot below and submit
            </li>
          </ol>

          {/* File upload area */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              proofFile
                ? 'border-green-300 bg-green-50'
                : 'border-blush-200 hover:border-blush-400 hover:bg-blush-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            aria-label="Select payment screenshot"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative w-full h-36 rounded-lg overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="Payment screenshot preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <p className="text-sm text-green-600 font-medium">✓ {proofFile?.name}</p>
                <p className="text-xs text-plum/50">Click to change</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-10 h-10 text-blush-300 mx-auto" />
                <p className="font-medium text-plum">Upload Screenshot</p>
                <p className="text-xs text-plum/50">JPEG, PNG or WebP · Max 5 MB</p>
              </div>
            )}
          </div>

          {/* Optional UPI reference */}
          <div className="mt-4">
            <label className="label" htmlFor="upiRef">
              UPI Transaction Reference{' '}
              <span className="text-plum/40 font-normal">(optional)</span>
            </label>
            <input
              id="upiRef"
              type="text"
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value)}
              className="input-field"
              placeholder="12-digit UTR or transaction ID"
              maxLength={30}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!proofFile || submitting}
            className="btn-primary w-full mt-5"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Submit Payment Details'
            )}
          </button>

          <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Your order will only be processed after our team verifies your payment in our
            bank/UPI records. This may take up to 24 hours.
          </div>
        </div>
      </div>
    </div>
  );
}
