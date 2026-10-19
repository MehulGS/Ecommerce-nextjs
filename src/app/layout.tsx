import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/contexts/CartContext';

export const metadata: Metadata = {
  title: {
    default: 'Diva — Gifts with Love, Crafted with Care',
    template: '%s | Diva',
  },
  description:
    'Discover beautiful Korean earrings, cute jewellery, scrunchies, hair accessories, and heartfelt gift hampers for every occasion. Shop premium gifts curated with love.',
  keywords: [
    'Korean earrings', 'cute jewellery', 'gift hampers', 'birthday gifts',
    'friendship gifts', 'romantic gifts', 'scrunchies', 'hair accessories',
    'premium gifts India', 'customised gifting',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Diva',
    title: 'Diva — Gifts with Love, Crafted with Care',
    description:
      'Premium Korean earrings, cute jewellery, and heartfelt gift hampers for every occasion.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diva',
    description: 'Gifts with love, crafted with care.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ivory">
        <CartProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#3D1C3C',
                color: '#FAF6EE',
                borderRadius: '12px',
                fontFamily: 'DM Sans, sans-serif',
              },
              success: {
                iconTheme: {
                  primary: '#C9A96E',
                  secondary: '#FAF6EE',
                },
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
