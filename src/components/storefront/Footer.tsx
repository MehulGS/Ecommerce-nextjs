import React from 'react';
import Link from 'next/link';
import { Heart, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-plum text-ivory/80">
      {/* Main Footer */}
      <div className="container-wide py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blush to-ivory/20 flex items-center justify-center">
                <span className="text-ivory font-serif font-bold text-lg">C</span>
              </div>
              <span className="font-serif font-bold text-ivory text-2xl tracking-tight">
                Craftlove<span className="text-gold">01</span>
              </span>
            </Link>
            <p className="text-ivory/60 text-sm leading-relaxed mb-6">
              Curating beautiful gifts with love — Korean earrings, cute jewellery,
              scrunchies, and heartfelt hampers for every special occasion.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com/craftlove01"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-ivory/10 hover:bg-blush rounded-full flex items-center justify-center transition-colors text-ivory text-sm font-bold"
                aria-label="Instagram"
              >
                📸
              </a>
              <a
                href="https://facebook.com/craftlove01"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-ivory/10 hover:bg-blush rounded-full flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="mailto:hello@craftlove01.com"
                className="w-9 h-9 bg-ivory/10 hover:bg-blush rounded-full flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-serif text-ivory font-semibold text-lg mb-5">Shop</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'All Products', href: '/products' },
                { label: 'Korean Earrings', href: '/products?category=korean-earrings' },
                { label: 'Cute Jewellery', href: '/products?category=jewellery' },
                { label: 'Scrunchies & Hair', href: '/products?category=scrunchies' },
                { label: 'Accessories', href: '/products?category=accessories' },
                { label: 'New Arrivals', href: '/products?filter=new' },
                { label: 'Bestsellers', href: '/products?filter=bestsellers' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-ivory transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Gifts */}
          <div>
            <h3 className="font-serif text-ivory font-semibold text-lg mb-5">Gift Ideas</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Gift Hampers', href: '/products?category=gift-hampers' },
                { label: 'Premium Gifts', href: '/products?category=premium-hampers' },
                { label: 'Budget-Friendly', href: '/products?category=budget-hampers' },
                { label: 'Birthday Gifts', href: '/products?tag=birthday' },
                { label: 'Friendship Gifts', href: '/products?tag=friendship' },
                { label: 'Romantic Gifts', href: '/products?tag=romantic' },
                { label: 'Gifts Under ₹499', href: '/products?maxPrice=499' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-ivory transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Policies */}
          <div>
            <h3 className="font-serif text-ivory font-semibold text-lg mb-5">Help & Info</h3>
            <ul className="space-y-2.5 mb-6">
              {[
                { label: 'About Us', href: '#brand-story' },
                { label: 'FAQ', href: '#faq' },
                { label: 'Shipping Policy', href: '/shipping-policy' },
                { label: 'Return Policy', href: '/return-policy' },
                { label: 'Privacy Policy', href: '/privacy-policy' },
                { label: 'Terms & Conditions', href: '/terms' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-ivory transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact */}
            <div className="space-y-2">
              <a
                href="tel:+919999999999"
                className="flex items-center gap-2 text-sm hover:text-ivory transition-colors"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                +91 99999 99999
              </a>
              <a
                href="mailto:hello@craftlove01.com"
                className="flex items-center gap-2 text-sm hover:text-ivory transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                hello@craftlove01.com
              </a>
              <div className="flex items-start gap-2 text-sm text-ivory/60">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                India
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-ivory/10">
        <div className="container-wide py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-ivory/50">
          <p>
            © {new Date().getFullYear()} Craftlove01. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-blush fill-blush" /> for gifting
          </p>
          <p>UPI · Cards · Net Banking · Wallets</p>
        </div>
      </div>
    </footer>
  );
}
