import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Package, Truck, Clock } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false },
};

async function getOrder(orderNumber: string) {
  try {
    await connectDB();
    const order = await Order.findOne({ orderNumber }).lean();
    return order ? JSON.parse(JSON.stringify(order)) : null;
  } catch { return null; }
}

export default async function OrderConfirmationPage({ params }: { params: { orderNumber: string } }) {
  const order = await getOrder(params.orderNumber);

  if (!order) {
    return (
      <div className="container-narrow py-20 text-center">
        <h1 className="font-serif text-2xl text-plum mb-3">Order Not Found</h1>
        <p className="text-plum/50 mb-6">We couldn&apos;t find an order with this reference.</p>
        <Link href="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';
  const isPending = order.paymentStatus === 'pending' || order.paymentStatus === 'verification_required';

  return (
    <div className="bg-ivory min-h-screen py-14">
      <div className="container-narrow max-w-2xl">
        {/* Status Banner */}
        <div className={`rounded-3xl p-8 text-center mb-8 ${isPaid ? 'bg-green-50' : 'bg-amber-50'}`}>
          {isPaid ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          )}
          <h1 className="font-serif text-3xl font-semibold text-plum mb-2">
            {isPaid ? 'Order Confirmed! 🎉' : 'Order Placed!'}
          </h1>
          <p className="text-plum/60">
            {isPaid
              ? 'Your payment was received and your order is confirmed.'
              : 'We received your order. Awaiting payment verification.'}
          </p>
          <p className="mt-3 font-mono text-lg font-semibold text-plum">
            #{order.orderNumber}
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl p-6 shadow-soft mb-5">
          <h2 className="font-serif text-lg font-semibold text-plum mb-4">Order Summary</h2>
          <div className="space-y-3">
            {order.items.map((item: {
              productSnapshot: { name: string; sku: string; price: number };
              quantity: number;
              total: number;
            }, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-plum">
                  {item.productSnapshot.name} × {item.quantity}
                </span>
                <span className="font-medium text-plum">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-blush-100 space-y-2 text-sm">
            <div className="flex justify-between text-plum/60">
              <span>Shipping</span>
              <span>{order.shippingCharge === 0 ? 'FREE' : formatCurrency(order.shippingCharge)}</span>
            </div>
            <div className="flex justify-between font-bold text-plum">
              <span>Total Paid</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-2xl p-6 shadow-soft mb-5">
          <h2 className="font-serif text-lg font-semibold text-plum mb-3">Delivery To</h2>
          <div className="text-sm text-plum/70 space-y-0.5">
            <p className="font-medium text-plum">{order.customer.fullName}</p>
            <p>{order.customer.addressLine1}</p>
            {order.customer.addressLine2 && <p>{order.customer.addressLine2}</p>}
            <p>{order.customer.city}, {order.customer.state} - {order.customer.pincode}</p>
            <p className="mt-2">{order.customer.email} · {order.customer.phone}</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blush-50 rounded-2xl p-5 mb-8">
          <h3 className="font-semibold text-plum mb-3">What happens next?</h3>
          <ol className="space-y-2 text-sm text-plum/70">
            {isPending ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0 mt-0.5">1</span>
                  We will verify your payment within 24 hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0 mt-0.5">2</span>
                  Once verified, your order will be confirmed
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0 mt-0.5">3</span>
                  We&apos;ll pack and dispatch your order
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0 mt-0.5">4</span>
                  Tracking details will be shared via email
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Payment confirmed ✓
                </li>
                <li className="flex items-start gap-2">
                  <Package className="w-4 h-4 text-plum/40 flex-shrink-0 mt-0.5" />
                  Your order will be packed and dispatched soon
                </li>
                <li className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-plum/40 flex-shrink-0 mt-0.5" />
                  Expected delivery: 5-7 business days
                </li>
              </>
            )}
          </ol>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">Continue Shopping</Link>
          <a
            href={`https://wa.me/?text=Order%20${order.orderNumber}%20placed%20on%20Craftlove01`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Share on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
