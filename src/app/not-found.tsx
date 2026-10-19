import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <span className="text-8xl block mb-6">💫</span>
        <h1 className="font-serif text-5xl font-bold text-plum mb-4">404</h1>
        <h2 className="font-serif text-2xl text-plum mb-3">Oops! Page not found</h2>
        <p className="text-plum/60 mb-8">
          The page you&apos;re looking for seems to have wandered off. 
          Let&apos;s get you back to all the beautiful things!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            🏠 Return Home
          </Link>
          <Link href="/products" className="btn-secondary">
            🛍️ Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
