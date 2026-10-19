import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wishlist',
};

export default function WishlistPage() {
  return (
    <div className="container-narrow py-20 text-center">
      <Heart className="w-16 h-16 text-blush-200 mx-auto mb-4" />
      <h1 className="font-serif text-3xl text-plum mb-3">Your Wishlist</h1>
      <p className="text-plum/50 mb-6">
        Wishlist feature coming soon! For now, browse our beautiful collection.
      </p>
      <Link href="/products" className="btn-primary">
        Browse Products
      </Link>
    </div>
  );
}
