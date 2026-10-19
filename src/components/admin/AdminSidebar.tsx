'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Users,
  Settings, LogOut, Menu, X, Gift, Percent, CreditCard, Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
  { label: 'Coupons', href: '/admin/coupons', icon: Percent },
  { label: 'Customers', href: '/admin/customers', icon: Users },
];

const settingsItems = [
  { label: 'Store Settings', href: '/admin/settings', icon: Settings },
  { label: 'Payments', href: '/admin/settings/payments', icon: CreditCard },
  { label: 'Shipping', href: '/admin/settings/shipping', icon: Truck },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    toast.success('Logged out successfully');
    router.push('/admin/login');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-blush-100">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blush to-plum flex items-center justify-center">
            <span className="text-ivory font-serif font-bold">C</span>
          </div>
          <div>
            <p className="font-serif font-bold text-plum text-lg leading-tight">
              Craftlove<span className="text-gold">01</span>
            </p>
            <p className="text-xs text-plum/40">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-plum/30 uppercase tracking-wider mb-2">Main</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-blush-100" />
        <p className="px-4 text-xs font-semibold text-plum/30 uppercase tracking-wider mb-2">Settings</p>
        {settingsItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-blush-100" />
        <Link
          href="/"
          target="_blank"
          className="admin-sidebar-link"
          onClick={() => setOpen(false)}
        >
          <Gift className="w-4.5 h-4.5" />
          View Store
        </Link>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-blush-100">
        <button
          onClick={handleLogout}
          className="admin-sidebar-link w-full text-red-400 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4.5 h-4.5" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-card"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-plum/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-blush-100 h-screen sticky top-0 flex-col">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
