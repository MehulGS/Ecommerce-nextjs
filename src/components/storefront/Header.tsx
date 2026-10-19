'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, X, Heart, ChevronDown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';

const navLinks = [
  {
    label: 'Shop',
    href: '/products',
    submenu: [
      { label: 'All Products', href: '/products' },
      { label: 'Korean Earrings', href: '/products?category=korean-earrings' },
      { label: 'Jewellery', href: '/products?category=jewellery' },
      { label: 'Scrunchies & Hair', href: '/products?category=scrunchies' },
      { label: 'Accessories', href: '/products?category=accessories' },
    ],
  },
  {
    label: 'Gifts',
    href: '/products?tag=gifts',
    submenu: [
      { label: 'Gift Hampers', href: '/products?category=gift-hampers' },
      { label: 'Premium Gifts', href: '/products?category=premium-hampers' },
      { label: 'Budget-Friendly', href: '/products?category=budget-hampers' },
      { label: 'Gifts Under ₹499', href: '/products?maxPrice=499' },
      { label: 'Gifts Under ₹999', href: '/products?maxPrice=999' },
    ],
  },
  {
    label: 'Occasions',
    href: '/products?tag=occasions',
    submenu: [
      { label: 'Birthday Gifts', href: '/products?tag=birthday' },
      { label: 'Friendship Gifts', href: '/products?tag=friendship' },
      { label: 'Romantic Gifts', href: '/products?tag=romantic' },
    ],
  },
  { label: 'About', href: '#brand-story', submenu: [] },
];

export default function Header() {
  const { totalItems, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-ivory/95 backdrop-blur-sm shadow-soft border-b border-blush-100'
            : 'bg-ivory'
        }`}
      >
        {/* Announcement Bar */}
        <div className="announcement-bar text-xs md:text-sm">
          ✨ Free shipping on orders above ₹999 &nbsp;|&nbsp; 🎁 Custom gifting available &nbsp;|&nbsp; 💌 Same-day dispatch available
        </div>

        <div className="container-wide">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-blush to-plum flex items-center justify-center shadow-soft">
                <span className="text-ivory font-serif font-bold text-base md:text-lg">C</span>
              </div>
              <div>
                <span className="font-serif font-bold text-plum text-xl md:text-2xl tracking-tight">
                  Craftlove
                  <span className="text-gold">01</span>
                </span>
                <p className="hidden md:block text-xs text-plum/50 font-sans leading-none">
                  Gifts with love
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative group"
                  onMouseEnter={() => setActiveSubmenu(link.label)}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <Link
                    href={link.href}
                    className="nav-link flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blush-50"
                  >
                    {link.label}
                    {link.submenu.length > 0 && (
                      <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
                    )}
                  </Link>
                  {link.submenu.length > 0 && activeSubmenu === link.label && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-hover border border-blush-100 py-2 w-52 animate-slide-up z-50">
                      {link.submenu.map((sub) => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className="block px-4 py-2.5 text-sm text-plum/70 hover:text-plum hover:bg-blush-50 transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="btn-ghost w-10 h-10 p-0 rounded-full"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="hidden md:flex btn-ghost w-10 h-10 p-0 rounded-full"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative btn-ghost w-10 h-10 p-0 rounded-full"
                aria-label={`Shopping bag, ${totalItems} items`}
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-blush text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-sm">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden btn-ghost w-10 h-10 p-0 rounded-full"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <div className="pb-4 animate-slide-up">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for gifts, earrings, hampers..."
                  className="input-field pl-12"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-plum/40" />
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-ivory border-t border-blush-100 animate-slide-up">
            <nav className="container-wide py-4 space-y-1">
              {navLinks.map((link) => (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    className="block px-4 py-3 text-plum font-medium rounded-xl hover:bg-blush-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                  {link.submenu.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {link.submenu.map((sub) => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className="block px-4 py-2 text-sm text-plum/60 hover:text-plum rounded-lg hover:bg-blush-50"
                          onClick={() => setMobileOpen(false)}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[100px] md:h-[116px]" />

      <CartDrawer />
    </>
  );
}
