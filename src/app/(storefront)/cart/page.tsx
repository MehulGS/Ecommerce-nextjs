import React from 'react';
import type { Metadata } from 'next';
import CartPage from '@/components/cart/CartPage';

export const metadata: Metadata = {
  title: 'Shopping Bag',
  description: 'Review your items and proceed to checkout.',
};

export default function CartRoute() {
  return <CartPage />;
}
