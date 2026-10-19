import React from 'react';
import type { Metadata } from 'next';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin Login — Diva',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blush to-plum flex items-center justify-center shadow-card">
              <span className="text-ivory font-serif font-bold text-xl">C</span>
            </div>
            <span className="font-serif font-bold text-plum text-3xl">
              Craftlove<span className="text-gold">01</span>
            </span>
          </div>
          <p className="text-plum/50 text-sm">Admin Dashboard</p>
        </div>

        <div className="card p-8">
          <h1 className="font-serif text-2xl font-semibold text-plum mb-6 text-center">
            Sign In
          </h1>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
