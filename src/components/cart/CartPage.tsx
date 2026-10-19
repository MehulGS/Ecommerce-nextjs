'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart();

  const shippingCharge = subtotal >= 999 ? 0 : 79;
  const total = subtotal + shippingCharge;

  if (items.length === 0) {
    return (
      <div className="container-narrow py-20 text-center">
        <ShoppingBag className="w-20 h-20 text-blush-200 mx-auto mb-6" />
        <h1 className="font-serif text-3xl text-plum mb-3">Your bag is empty</h1>
        <p className="text-plum/50 mb-8">
          Add some beautiful items to your shopping bag!
        </p>
        <Link href="/products" className="btn-primary">
          <ArrowLeft className="w-5 h-5" />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-ivory min-h-screen py-10">
      <div className="container-wide">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-plum mb-8">
          Shopping Bag ({totalItems})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="bg-white rounded-2xl p-5 shadow-soft flex gap-5">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-blush-50">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-blush-200" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.slug}`} className="font-medium text-plum hover:text-blush-600 transition-colors">
                    {item.name}
                  </Link>
                  <p className="text-xs text-plum/40 mt-0.5 mb-3">SKU: {item.sku}</p>

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center bg-blush-50 rounded-full px-2 py-1.5 gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blush-200 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5 text-plum" />
                      </button>
                      <span className="w-6 text-center font-medium text-plum text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blush-200 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5 text-plum" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-plum">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      {item.originalPrice && (
                        <p className="price-original text-xs">
                          {formatCurrency(item.originalPrice * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-plum/30 hover:text-red-400 transition-colors self-start"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <Link href="/products" className="flex items-center gap-2 text-sm text-plum/50 hover:text-plum transition-colors mt-2">
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-soft sticky top-28">
              <h2 className="font-serif text-xl font-semibold text-plum mb-5">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-plum/70">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-plum/70">
                  <span>Shipping</span>
                  <span>
                    {shippingCharge === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      formatCurrency(shippingCharge)
                    )}
                  </span>
                </div>

                {subtotal < 999 && (
                  <div className="bg-peach-50 rounded-xl p-3 text-xs text-gold-dark">
                    Add {formatCurrency(999 - subtotal)} more to get free shipping! 🚚
                  </div>
                )}

                <div className="border-t border-blush-100 pt-3 flex justify-between font-semibold text-plum">
                  <span>Total</span>
                  <span className="text-lg">{formatCurrency(total)}</span>
                </div>
                <p className="text-xs text-plum/40">Inclusive of all taxes</p>
              </div>

              <Link href="/checkout" className="btn-primary w-full mt-5">
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
