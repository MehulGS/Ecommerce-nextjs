'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Truck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  _id: string;
  orderNumber: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  paymentMethod: string;
  /** Customer-supplied UPI transaction reference (stored in qrPaymentProofPublicId or paymentReference) */
  paymentReference?: string;
  qrPaymentProofPublicId?: string;
}

interface Props {
  order: Order;
}

const FULFILMENT_STATES = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
];

export default function AdminOrderActions({ order }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState('');
  const [carrier, setCarrier] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [refundRef, setRefundRef] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const updateOrder = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Order updated');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to update order');
      }
    } catch {
      toast.error('Error updating order');
    } finally {
      setLoading(false);
    }
  };

  const verifyQRPayment = () => {
    if (
      !confirm(
        'Have you verified this payment in your bank/UPI records?\n\n' +
          'This action marks the order as PAID and deducts inventory.\n' +
          'This cannot be undone without a manual refund workflow.'
      )
    )
      return;
    updateOrder({
      paymentStatus: 'paid',
      fulfilmentStatus: 'confirmed',
      adminNotes: adminNotes || undefined,
    });
  };

  const confirmRejectQRPayment = () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    updateOrder({
      paymentStatus: 'rejected',
      adminNotes: `[Payment Rejected] ${rejectReason.trim()}`,
    });
    setShowRejectForm(false);
    setRejectReason('');
  };

  // Customer-supplied UPI reference (may be stored in either field)
  const customerUpiRef =
    order.paymentReference || (order.qrPaymentProofPublicId?.length ? order.qrPaymentProofPublicId : '');

  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft space-y-5">
      <h2 className="font-semibold text-plum">Admin Actions</h2>

      {/* ── QR Payment Verification ─────────────────────────────────────────── */}
      {order.paymentMethod === 'static_qr' &&
        order.paymentStatus === 'verification_required' && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              QR Payment — Pending Verification
            </p>

            {customerUpiRef && (
              <div className="bg-blush-50 rounded-xl p-3 text-sm">
                <span className="text-plum/50">Customer UPI Ref: </span>
                <span className="font-mono font-semibold text-plum">{customerUpiRef}</span>
              </div>
            )}

            {!showRejectForm ? (
              <div className="flex gap-2">
                <button
                  onClick={verifyQRPayment}
                  disabled={loading}
                  className="btn-primary text-sm py-2 flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Verify &amp; Confirm
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading}
                  className="btn-secondary text-sm py-2 flex-1 border-red-300 text-red-500 hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field py-2 h-20 resize-none"
                  placeholder="Reason for rejection (visible in order notes)"
                  required
                />
                <div className="flex gap-2">
                  <button
                    onClick={confirmRejectQRPayment}
                    disabled={loading || !rejectReason.trim()}
                    className="btn-secondary text-sm py-2 flex-1 border-red-300 text-red-500 hover:bg-red-50"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason('');
                    }}
                    className="btn-ghost text-sm py-2 flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-amber-600">
              ⚠️ Always verify the payment in your bank/UPI app before confirming. A screenshot
              alone is not proof of payment.
            </p>
          </div>
        )}

      {/* ── Guard: don't allow re-confirming an already-paid order ──────────── */}
      {order.paymentMethod === 'static_qr' && order.paymentStatus === 'paid' && (
        <div className="bg-green-50 text-green-700 rounded-xl p-3 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Payment confirmed. No further payment action needed.
        </div>
      )}

      {order.paymentMethod === 'static_qr' && order.paymentStatus === 'rejected' && (
        <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">
          Payment was rejected. Contact the customer if needed.
        </div>
      )}

      {/* ── Update Fulfilment Status ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-plum/50 uppercase tracking-wide">
          Update Fulfilment
        </p>
        <select
          defaultValue={order.fulfilmentStatus}
          onChange={(e) => {
            if (e.target.value !== order.fulfilmentStatus) {
              updateOrder({ fulfilmentStatus: e.target.value });
            }
          }}
          className="input-field py-2"
          disabled={loading}
        >
          {FULFILMENT_STATES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Tracking Info ────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-plum/50 uppercase tracking-wide">
          Tracking Information
        </p>
        <input
          type="text"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="input-field py-2"
          placeholder="Carrier (e.g., BlueDart, Delhivery)"
        />
        <input
          type="text"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          className="input-field py-2"
          placeholder="Tracking number"
        />
        <button
          onClick={() =>
            updateOrder({ shippingCarrier: carrier, trackingNumber: tracking, fulfilmentStatus: 'shipped' })
          }
          disabled={loading || !tracking}
          className="btn-primary text-sm py-2 w-full flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          Save &amp; Mark Shipped
        </button>
      </div>

      {/* ── Admin Notes ──────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-plum/50 uppercase tracking-wide">Admin Notes</p>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          className="input-field py-2 h-20 resize-none"
          placeholder="Internal notes (not visible to customer)"
        />
        <button
          onClick={() => updateOrder({ adminNotes })}
          disabled={loading || !adminNotes}
          className="btn-secondary text-sm py-2 w-full"
        >
          Save Notes
        </button>
      </div>

      {/* ── Refund ───────────────────────────────────────────────────────────── */}
      {(order.paymentStatus === 'paid' || order.paymentStatus === 'refund_pending') && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-plum/50 uppercase tracking-wide">Refund</p>
          <input
            type="text"
            value={refundRef}
            onChange={(e) => setRefundRef(e.target.value)}
            className="input-field py-2"
            placeholder="Refund reference / UTR"
          />
          <button
            onClick={() => updateOrder({ paymentStatus: 'refunded', refundReference: refundRef })}
            disabled={loading || !refundRef}
            className="btn-secondary text-sm py-2 w-full text-orange-600 border-orange-200"
          >
            Mark as Refunded
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin text-plum" />
        </div>
      )}
    </div>
  );
}
