import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { formatCurrency } from '@/lib/utils';
import AdminOrderActions from '@/components/admin/AdminOrderActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Details — Admin',
  robots: { index: false },
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  verification_required: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

async function getOrder(id: string) {
  try {
    await connectDB();
    const order = await Order.findById(id).lean();
    return order ? JSON.parse(JSON.stringify(order)) : null;
  } catch { return null; }
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);
  if (!order) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="btn-ghost py-2">
          <ArrowLeft className="w-4 h-4" />
          Orders
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-plum">Order #{order.orderNumber}</h1>
          <p className="text-plum/50 text-sm">
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status */}
          <div className="bg-white rounded-2xl p-5 shadow-soft flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-plum/50 mb-1">Payment Status</p>
                <span className={`badge px-3 py-1 text-sm ${statusColors[order.paymentStatus] ?? ''}`}>
                  {order.paymentStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="w-px h-8 bg-blush-100" />
              <div>
                <p className="text-xs text-plum/50 mb-1">Fulfilment Status</p>
                <span className={`badge px-3 py-1 text-sm ${statusColors[order.fulfilmentStatus] ?? ''}`}>
                  {order.fulfilmentStatus}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-plum/50">Total</p>
              <p className="text-xl font-bold text-plum">{formatCurrency(order.total)}</p>
            </div>
          </div>

          {/* QR Payment Proof */}
          {order.paymentMethod === 'static_qr' && order.qrPaymentProofUrl && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-amber-700">Payment Proof Submitted</h3>

              {/* Payment proof image — served through admin API */}
              {order.qrPaymentProofUrl.startsWith('/api/admin/payment-proof/') ? (
                <div className="relative w-48 h-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.qrPaymentProofUrl}
                    alt="Payment proof screenshot"
                    className="w-48 h-48 object-contain rounded-xl border border-amber-200"
                  />
                </div>
              ) : order.qrPaymentProofUrl && !order.qrPaymentProofUrl.startsWith('proof_') ? (
                /* Legacy Cloudinary URLs */
                <div className="relative w-48 h-48">
                  <Image
                    src={order.qrPaymentProofUrl}
                    alt="Payment proof"
                    fill
                    className="object-contain rounded-xl"
                  />
                </div>
              ) : null}

              {/* Customer-supplied UPI reference */}
              {(order.paymentReference || order.qrPaymentProofPublicId) && (
                <div className="text-sm">
                  <span className="text-amber-600 font-medium">Customer UPI Ref: </span>
                  <span className="font-mono text-plum">
                    {order.paymentReference || order.qrPaymentProofPublicId}
                  </span>
                </div>
              )}

              <p className="text-sm text-amber-600">
                ⚠️ Verify this payment in your bank/UPI records before confirming.
                The screenshot alone does not confirm payment receipt.
              </p>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-2xl p-5 shadow-soft">
            <h2 className="font-semibold text-plum mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item: {
                productSnapshot: { name: string; sku: string; image: string; price: number; originalPrice?: number };
                quantity: number;
                unitPrice: number;
                total: number;
              }, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-blush-50 flex-shrink-0">
                    {item.productSnapshot.image ? (
                      <Image
                        src={item.productSnapshot.image}
                        alt={item.productSnapshot.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-blush-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-plum">{item.productSnapshot.name}</p>
                    <p className="text-xs text-plum/40">SKU: {item.productSnapshot.sku}</p>
                    <p className="text-xs text-plum/50 mt-0.5">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-plum">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-blush-100 space-y-2 text-sm">
              <div className="flex justify-between text-plum/60">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.productDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Product Discount</span>
                  <span>-{formatCurrency(order.productDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-plum/60">
                <span>Shipping</span>
                <span>{order.shippingCharge === 0 ? 'FREE' : formatCurrency(order.shippingCharge)}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-{formatCurrency(order.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-plum text-base pt-2 border-t border-blush-100">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-blush-50 rounded-2xl p-4">
              <h3 className="font-semibold text-plum mb-1">Customer Notes</h3>
              <p className="text-sm text-plum/70">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Customer & Actions */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-2xl p-5 shadow-soft">
            <h2 className="font-semibold text-plum mb-4">Customer</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-plum">{order.customer.fullName}</p>
              <a href={`mailto:${order.customer.email}`} className="text-blush-500 hover:text-blush-600">
                {order.customer.email}
              </a>
              <a href={`tel:${order.customer.phone}`} className="block text-plum/70">
                {order.customer.phone}
              </a>
              {order.customer.instagramUsername && (
                <p className="text-plum/50">{order.customer.instagramUsername}</p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl p-5 shadow-soft">
            <h2 className="font-semibold text-plum mb-3">Shipping Address</h2>
            <div className="text-sm text-plum/70 space-y-0.5">
              <p>{order.customer.fullName}</p>
              <p>{order.customer.addressLine1}</p>
              {order.customer.addressLine2 && <p>{order.customer.addressLine2}</p>}
              {order.customer.landmark && <p>Near: {order.customer.landmark}</p>}
              <p>{order.customer.city}, {order.customer.state} - {order.customer.pincode}</p>
              <p>{order.customer.country}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl p-5 shadow-soft">
            <h2 className="font-semibold text-plum mb-3">Payment Info</h2>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-plum/50">Method</span>
                <span className="capitalize text-plum">{order.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
              {order.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-plum/50">Payment ID</span>
                  <span className="font-mono text-xs text-plum">{order.razorpayPaymentId}</span>
                </div>
              )}
              {order.razorpayOrderId && (
                <div className="flex justify-between">
                  <span className="text-plum/50">Gateway Order</span>
                  <span className="font-mono text-xs text-plum truncate max-w-32">{order.razorpayOrderId}</span>
                </div>
              )}
              {order.paymentReference && (
                <div className="flex justify-between">
                  <span className="text-plum/50">UPI Ref (Customer)</span>
                  <span className="font-mono text-xs text-plum">{order.paymentReference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tracking */}
          {(order.shippingCarrier || order.trackingNumber) && (
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <h2 className="font-semibold text-plum mb-3">Shipping Info</h2>
              <div className="text-sm space-y-1.5">
                {order.shippingCarrier && (
                  <div className="flex justify-between">
                    <span className="text-plum/50">Carrier</span>
                    <span className="text-plum">{order.shippingCarrier}</span>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-plum/50">Tracking</span>
                    <span className="font-mono text-plum">{order.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <AdminOrderActions
            order={{
              _id: order._id,
              orderNumber: order.orderNumber,
              paymentStatus: order.paymentStatus,
              fulfilmentStatus: order.fulfilmentStatus,
              paymentMethod: order.paymentMethod,
              paymentReference: order.paymentReference,
              qrPaymentProofPublicId: order.qrPaymentProofPublicId,
            }}
          />
        </div>
      </div>
    </div>
  );
}
