'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, QrCode, Loader2, CheckCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, isValidIndianPhone, isValidIndianPincode, isValidEmail } from '@/lib/utils';
import toast from 'react-hot-toast';
import QRPaymentStep from '@/components/checkout/QRPaymentStep';

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  instagramUsername: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  notes: string;
  couponCode: string;
  shippingMethod: 'standard' | 'express';
}

interface PriceBreakdown {
  subtotal: number;
  productDiscount: number;
  shippingCharge: number;
  couponDiscount: number;
  total: number;
}

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

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
];

export default function CheckoutPage() {
  const { items, clearCart, subtotal } = useCart();
  const [step, setStep] = useState<'details' | 'review' | 'qr'>('details');
  const [loading, setLoading] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [form, setForm] = useState<FormData>({
    fullName: '',
    phone: '+91 ',
    email: '',
    instagramUsername: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    notes: '',
    couponCode: '',
    shippingMethod: 'standard',
  });

  // Calculate prices whenever cart, shipping, or coupon changes
  useEffect(() => {
    if (items.length === 0) return;
    const cartItems = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    fetch('/api/checkout/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems,
        shippingMethod: form.shippingMethod,
        couponCode: form.couponCode || undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.breakdown) setPriceBreakdown(data.breakdown); })
      .catch(() => {});
  }, [items, form.shippingMethod, form.couponCode]);

  const update = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!isValidIndianPhone(form.phone)) e.phone = 'Enter a valid Indian mobile number';
    if (!isValidEmail(form.email)) e.email = 'Enter a valid email address';
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state) e.state = 'State is required';
    if (!isValidIndianPincode(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }
    setStep('review');
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: form.fullName,
            phone: form.phone,
            email: form.email,
            instagramUsername: form.instagramUsername || undefined,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2 || undefined,
            landmark: form.landmark || undefined,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            country: form.country,
          },
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod: 'static_qr',
          shippingMethod: form.shippingMethod,
          notes: form.notes || undefined,
          couponCode: form.couponCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create order');
        return;
      }

      setCreatedOrder(data.order);
      setStep('qr');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Empty cart ────────────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="container-narrow py-20 text-center">
        <span className="text-5xl block mb-4">🛍️</span>
        <h1 className="font-serif text-2xl text-plum mb-3">Your bag is empty</h1>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  // ── QR payment step ───────────────────────────────────────────────────────────

  if (step === 'qr' && createdOrder) {
    return (
      <QRPaymentStep
        order={createdOrder}
        onSuccess={() => {
          clearCart();
          window.location.href = `/order-confirmation/${createdOrder.orderNumber}`;
        }}
      />
    );
  }

  const shippingCharge = priceBreakdown?.shippingCharge ?? (subtotal >= 999 ? 0 : 79);
  const total = priceBreakdown?.total ?? subtotal + shippingCharge;

  const steps = ['details', 'review'] as const;

  // ── Main layout ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-ivory min-h-screen py-10">
      <div className="container-wide max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="flex items-center gap-2 text-sm text-plum/50 hover:text-plum mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to bag
          </Link>
          <h1 className="font-serif text-3xl font-semibold text-plum">Checkout</h1>

          {/* Step indicators */}
          <div className="flex items-center gap-4 mt-4">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 text-sm font-medium ${
                  step === s ? 'text-plum'
                  : i < steps.indexOf(step as typeof steps[number]) ? 'text-green-600'
                  : 'text-plum/30'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    step === s ? 'bg-plum text-ivory'
                    : i < steps.indexOf(step as typeof steps[number]) ? 'bg-green-500 text-white'
                    : 'bg-blush-100 text-plum/30'
                  }`}>
                    {i < steps.indexOf(step as typeof steps[number])
                      ? <CheckCircle className="w-4 h-4" />
                      : i + 1}
                  </div>
                  <span className="hidden sm:inline capitalize">
                    {s === 'details' ? 'Your Details' : 'Review & Pay'}
                  </span>
                </div>
                {i < steps.length - 1 && <div className="flex-1 h-px bg-blush-100" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Left: Form ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-3">

            {/* Step 1: Details */}
            {step === 'details' && (
              <form onSubmit={handleSubmitDetails} className="space-y-6">
                {/* Customer Info */}
                <div className="bg-white rounded-2xl p-6 shadow-soft space-y-5">
                  <h2 className="font-serif text-xl font-semibold text-plum">Your Information</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label" htmlFor="fullName">Full Name *</label>
                      <input
                        id="fullName" type="text" value={form.fullName}
                        onChange={(e) => update('fullName', e.target.value)}
                        className={`input-field ${errors.fullName ? 'border-red-300' : ''}`}
                        placeholder="Your full name" required
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="phone">Phone Number *</label>
                      <input
                        id="phone" type="tel" value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        className={`input-field ${errors.phone ? 'border-red-300' : ''}`}
                        placeholder="+91 98765 43210" required
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label" htmlFor="email">Email Address *</label>
                      <input
                        id="email" type="email" value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                        placeholder="your@email.com" required
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="instagram">Instagram (optional)</label>
                      <input
                        id="instagram" type="text" value={form.instagramUsername}
                        onChange={(e) => update('instagramUsername', e.target.value)}
                        className="input-field" placeholder="@yourusername"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-2xl p-6 shadow-soft space-y-5">
                  <h2 className="font-serif text-xl font-semibold text-plum">Shipping Address</h2>

                  <div>
                    <label className="label" htmlFor="addressLine1">Address *</label>
                    <input
                      id="addressLine1" type="text" value={form.addressLine1}
                      onChange={(e) => update('addressLine1', e.target.value)}
                      className={`input-field ${errors.addressLine1 ? 'border-red-300' : ''}`}
                      placeholder="House/Flat no., Street name" required
                    />
                    {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label" htmlFor="addressLine2">Address Line 2 (optional)</label>
                      <input id="addressLine2" type="text" value={form.addressLine2}
                        onChange={(e) => update('addressLine2', e.target.value)}
                        className="input-field" placeholder="Area, Colony" />
                    </div>
                    <div>
                      <label className="label" htmlFor="landmark">Landmark (optional)</label>
                      <input id="landmark" type="text" value={form.landmark}
                        onChange={(e) => update('landmark', e.target.value)}
                        className="input-field" placeholder="Near ..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label" htmlFor="city">City *</label>
                      <input id="city" type="text" value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        className={`input-field ${errors.city ? 'border-red-300' : ''}`}
                        placeholder="Mumbai" required />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="state">State *</label>
                      <select id="state" value={form.state}
                        onChange={(e) => update('state', e.target.value)}
                        className={`input-field ${errors.state ? 'border-red-300' : ''}`} required>
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="pincode">Pincode *</label>
                      <input id="pincode" type="text" value={form.pincode}
                        onChange={(e) => update('pincode', e.target.value)}
                        className={`input-field ${errors.pincode ? 'border-red-300' : ''}`}
                        placeholder="400001" maxLength={6} required />
                      {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                    </div>
                  </div>
                </div>

                {/* Delivery Option */}
                <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
                  <h2 className="font-serif text-xl font-semibold text-plum">Delivery Option</h2>
                  <div className="space-y-3">
                    {[
                      { value: 'standard', label: 'Standard Delivery', desc: '5-7 business days', price: subtotal >= 999 ? 'FREE' : '₹79' },
                      { value: 'express', label: 'Express Delivery', desc: '2-3 business days', price: '₹149' },
                    ].map((opt) => (
                      <label key={opt.value} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.shippingMethod === opt.value ? 'border-plum bg-blush-50' : 'border-blush-100 hover:border-blush-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="shippingMethod" value={opt.value}
                            checked={form.shippingMethod === opt.value as 'standard' | 'express'}
                            onChange={() => update('shippingMethod', opt.value)}
                            className="accent-plum" />
                          <div>
                            <p className="font-medium text-plum">{opt.label}</p>
                            <p className="text-xs text-plum/50">{opt.desc}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-plum">{opt.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order Notes */}
                <div className="bg-white rounded-2xl p-6 shadow-soft">
                  <label className="label" htmlFor="notes">Order Notes (optional)</label>
                  <textarea id="notes" value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    className="input-field h-24 resize-none"
                    placeholder="Special instructions, gift message, etc." />
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-base">
                  Review Order
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}

            {/* Step 2: Review & Pay */}
            {step === 'review' && (
              <div className="space-y-6">
                {/* Payment method indicator (static QR only) */}
                <div className="bg-white rounded-2xl p-6 shadow-soft">
                  <h2 className="font-serif text-xl font-semibold text-plum mb-4">Payment</h2>
                  <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-plum bg-blush-50">
                    <QrCode className="w-6 h-6 text-plum flex-shrink-0" />
                    <div>
                      <p className="font-medium text-plum">UPI / QR Code</p>
                      <p className="text-xs text-plum/50">
                        You&apos;ll scan a QR code and upload your payment screenshot on the next screen
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery summary */}
                <div className="bg-white rounded-2xl p-6 shadow-soft space-y-2 text-sm">
                  <h2 className="font-serif text-lg font-semibold text-plum mb-3">Delivering to</h2>
                  <p className="font-medium text-plum">{form.fullName}</p>
                  <p className="text-plum/70">{form.addressLine1}{form.addressLine2 ? `, ${form.addressLine2}` : ''}</p>
                  <p className="text-plum/70">{form.city}, {form.state} — {form.pincode}</p>
                  <p className="text-plum/70">{form.phone} · {form.email}</p>
                  <button onClick={() => setStep('details')} className="text-xs text-blush-500 hover:text-blush-600 underline mt-1">
                    Edit details
                  </button>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep('details')} className="btn-secondary flex-1">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex-1 py-4">
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Place Order — {formatCurrency(total)}<ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Order Summary ─────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-soft sticky top-28">
              <h2 className="font-serif text-xl font-semibold text-plum mb-5">Order Summary</h2>

              <div className="space-y-4 mb-5 max-h-64 overflow-y-auto scrollbar-thin">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-blush-50">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px"
                          unoptimized={item.image.startsWith('blob:')} />
                      )}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-plum text-ivory text-xs rounded-full flex items-center justify-center font-medium">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-plum line-clamp-2">{item.name}</p>
                      <p className="text-xs text-plum/50 mt-0.5">{formatCurrency(item.price)} each</p>
                    </div>
                    <p className="text-sm font-medium text-plum flex-shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-plum/70">
                  <span>Subtotal</span>
                  <span>{formatCurrency(priceBreakdown?.subtotal ?? subtotal)}</span>
                </div>
                {(priceBreakdown?.productDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Product Discount</span>
                    <span>-{formatCurrency(priceBreakdown!.productDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-plum/70">
                  <span>Shipping</span>
                  <span>
                    {shippingCharge === 0
                      ? <span className="text-green-600 font-medium">FREE</span>
                      : formatCurrency(shippingCharge)}
                  </span>
                </div>
                {(priceBreakdown?.couponDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon</span>
                    <span>-{formatCurrency(priceBreakdown!.couponDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-blush-100 pt-3 flex justify-between font-semibold text-plum">
                  <span>Total Payable</span>
                  <span className="text-lg">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-plum/40">
                <span>🔒 Secure checkout</span>
                <span>·</span>
                <span>🇮🇳 Made in India</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
