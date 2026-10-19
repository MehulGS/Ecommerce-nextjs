'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems } =
    useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-plum/40 backdrop-blur-sm z-50"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-ivory z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-blush-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-plum" />
            <h2 className="font-serif text-xl font-semibold text-plum">
              Your Bag{' '}
              {totalItems > 0 && (
                <span className="text-sm font-sans font-normal text-plum/50">
                  ({totalItems} item{totalItems !== 1 ? 's' : ''})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blush-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-4 h-4 text-plum" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-blush-200 mb-4" />
              <h3 className="font-serif text-xl text-plum mb-2">Your bag is empty</h3>
              <p className="text-sm text-plum/50 mb-6">
                Discover beautiful gifts and accessories
              </p>
              <button onClick={closeCart} className="btn-primary">
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 bg-white rounded-2xl p-4 shadow-soft"
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-blush-50">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-blush-200" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="font-medium text-plum text-sm hover:text-blush transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-plum/40 mt-0.5">SKU: {item.sku}</p>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center gap-2 bg-blush-50 rounded-full px-1 py-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blush-200 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 text-plum" />
                        </button>
                        <span className="text-sm font-medium text-plum w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blush-200 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 text-plum" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-semibold text-plum text-sm">
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

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="w-7 h-7 flex items-center justify-center text-plum/30 hover:text-blush transition-colors flex-shrink-0"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-blush-100 bg-white space-y-4">
            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-plum/60">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {subtotal < 999 && (
                <div className="text-xs text-gold-dark bg-peach-50 rounded-lg px-3 py-2">
                  Add {formatCurrency(999 - subtotal)} more for free shipping! 🚚
                </div>
              )}
              {subtotal >= 999 && (
                <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  🎉 You&apos;ve unlocked free shipping!
                </div>
              )}
              <div className="flex items-center justify-between font-semibold text-plum">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(subtotal)}</span>
              </div>
              <p className="text-xs text-plum/40">Shipping calculated at checkout</p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn-primary w-full"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="btn-secondary w-full"
              >
                View Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
