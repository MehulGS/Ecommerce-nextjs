import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, Heart, Package, Truck, Shield, Gift } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import ProductCard, { ProductCardData } from '@/components/ui/ProductCard';

// Always fetch fresh data — never serve a stale cached page
export const revalidate = 0;

async function getFeaturedProducts() {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch { return []; }
}

async function getBestsellers() {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true, isBestseller: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch { return []; }
}

async function getNewArrivals() {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch { return []; }
}

async function getCategories() {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(categories));
  } catch { return []; }
}

const categoryEmojis: Record<string, string> = {
  'korean-earrings': '💎',
  'jewellery': '💍',
  'scrunchies': '🎀',
  'accessories': '✨',
  'gift-hampers': '🎁',
  'premium-hampers': '🌟',
  'budget-hampers': '💝',
};

const faqs = [
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery takes 5-7 business days. Express delivery (2-3 days) is also available at additional charges.',
  },
  {
    q: 'Can I customise a gift?',
    a: 'Yes! We offer personalised gifting options. DM us on Instagram @craftlove01 with your requirements.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept UPI, all major credit/debit cards, net banking, and popular wallets.',
  },
  {
    q: 'What is the return policy?',
    a: 'Returns are accepted within 7 days for damaged or incorrect items. Customised items are non-returnable.',
  },
  {
    q: 'Do you ship across India?',
    a: 'Yes, we ship pan-India. Free shipping on orders above ₹999.',
  },
];

const reviews = [
  {
    name: 'Priya M.',
    rating: 5,
    text: 'The Korean earrings I ordered are absolutely stunning! Packaging was beautiful too. Perfect gift for my bestie.',
  },
  {
    name: 'Ananya K.',
    rating: 5,
    text: 'Got the birthday hamper for my mom — she was over the moon! Every item was carefully curated and packed with so much love.',
  },
  {
    name: 'Shreya R.',
    rating: 5,
    text: 'The scrunchies are SO cute and the quality is amazing. Already bought three sets and planning to order more!',
  },
  {
    name: 'Divya P.',
    rating: 5,
    text: 'Quick delivery, beautiful products, and excellent customer service. This is my go-to gifting store now!',
  },
];

export default async function HomePage() {
  const [featuredProducts, bestsellers, newArrivals, categories] = await Promise.all([
    getFeaturedProducts(),
    getBestsellers(),
    getNewArrivals(),
    getCategories(),
  ]);

  return (
    <div className="bg-ivory">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-gradient min-h-[90vh] flex items-center">
        <div className="container-wide py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl animate-fade-in">
              <span className="inline-flex items-center gap-2 bg-blush-100 text-blush-600 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                <Heart className="w-4 h-4 fill-current" />
                New Korean Collection is here!
              </span>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-plum leading-tight mb-6">
                Gifts that feel
                <span className="text-blush block italic">like a hug</span>
              </h1>
              <p className="text-plum/60 text-lg leading-relaxed mb-8">
                Discover our curated collection of Korean earrings, adorable jewellery,
                scrunchies, and thoughtfully packed gift hampers — perfect for every
                special someone.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/products" className="btn-primary text-base px-8 py-4">
                  Shop Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/products?category=gift-hampers" className="btn-secondary text-base px-8 py-4">
                  <Gift className="w-5 h-5" />
                  Browse Gifts
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex flex-wrap gap-6">
                {[
                  { icon: <Truck className="w-4 h-4" />, text: 'Free ship ₹999+' },
                  { icon: <Package className="w-4 h-4" />, text: 'Gift wrapping' },
                  { icon: <Shield className="w-4 h-4" />, text: 'Secure payment' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-sm text-plum/60">
                    <span className="text-gold">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image Grid */}
            <div className="hidden lg:grid grid-cols-2 gap-4 relative">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-blush-200 to-lavender-200 shadow-card">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <span className="text-6xl">💎</span>
                      <p className="mt-4 font-serif text-plum text-lg font-semibold">Korean Earrings</p>
                      <p className="text-plum/60 text-sm mt-1">From ₹299</p>
                    </div>
                  </div>
                </div>
                <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-peach-200 to-blush-100 shadow-card">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-6">
                      <span className="text-5xl">🎀</span>
                      <p className="mt-3 font-serif text-plum font-semibold">Scrunchies</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-lavender-100 to-blush-100 shadow-card">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-6">
                      <span className="text-5xl">🎁</span>
                      <p className="mt-3 font-serif text-plum font-semibold">Gift Hampers</p>
                    </div>
                  </div>
                </div>
                <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-peach-100 to-lavender-100 shadow-card">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <span className="text-6xl">💍</span>
                      <p className="mt-4 font-serif text-plum text-lg font-semibold">Cute Jewellery</p>
                      <p className="text-plum/60 text-sm mt-1">From ₹199</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-10">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find exactly what you&apos;re looking for</p>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat: { _id: string; name: string; slug: string; image?: string }) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center p-6 bg-ivory rounded-2xl hover:bg-blush-50 transition-all duration-300 hover:shadow-card"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blush-100 to-lavender-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">
                      {categoryEmojis[cat.slug] ?? '✨'}
                    </span>
                  </div>
                  <span className="font-medium text-plum text-sm text-center group-hover:text-blush-600 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { name: 'Korean Earrings', slug: 'korean-earrings', emoji: '💎' },
                { name: 'Cute Jewellery', slug: 'jewellery', emoji: '💍' },
                { name: 'Scrunchies', slug: 'scrunchies', emoji: '🎀' },
                { name: 'Accessories', slug: 'accessories', emoji: '✨' },
                { name: 'Gift Hampers', slug: 'gift-hampers', emoji: '🎁' },
                { name: 'Premium Gifts', slug: 'premium-hampers', emoji: '🌟' },
                { name: 'Budget Gifts', slug: 'budget-hampers', emoji: '💝' },
                { name: 'Birthday Gifts', slug: 'birthday', emoji: '🎂' },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center p-6 bg-ivory rounded-2xl hover:bg-blush-50 transition-all duration-300 hover:shadow-card"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blush-100 to-lavender-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">{cat.emoji}</span>
                  </div>
                  <span className="font-medium text-plum text-sm text-center group-hover:text-blush-600 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-16 md:py-20 bg-ivory">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title">New Arrivals</h2>
                <p className="section-subtitle">Fresh picks, just for you</p>
              </div>
              <Link href="/products?filter=new" className="text-sm text-blush-500 hover:text-blush-600 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.map((product: ProductCardData) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title">✨ Bestsellers</h2>
                <p className="section-subtitle">Loved by hundreds of happy customers</p>
              </div>
              <Link href="/products?filter=bestsellers" className="text-sm text-blush-500 hover:text-blush-600 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {bestsellers.map((product: ProductCardData) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Budget Gifts Banner */}
      <section className="py-16 bg-gradient-to-r from-blush-50 via-ivory to-lavender-50">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/products?maxPrice=499"
              className="group bg-white rounded-3xl p-8 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
            >
              <span className="text-5xl mb-4 block">💝</span>
              <h3 className="font-serif text-2xl font-semibold text-plum mb-2">
                Gifts Under ₹499
              </h3>
              <p className="text-plum/60 mb-4">
                Beautiful gifts that don&apos;t break the bank. Thoughtful, affordable, lovely.
              </p>
              <span className="btn-primary inline-flex">
                Shop Now <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link
              href="/products?category=premium-hampers"
              className="group bg-gradient-to-br from-plum to-plum-700 rounded-3xl p-8 text-ivory shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
            >
              <span className="text-5xl mb-4 block">👑</span>
              <h3 className="font-serif text-2xl font-semibold mb-2">
                Premium Gift Hampers
              </h3>
              <p className="text-ivory/70 mb-4">
                Luxurious, curated hampers for those extra-special moments.
              </p>
              <span className="bg-gold text-ivory inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium hover:bg-gold-dark transition-colors">
                Explore <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-20 bg-ivory">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title">Featured Collection</h2>
                <p className="section-subtitle">Handpicked favourites</p>
              </div>
              <Link href="/products?filter=featured" className="text-sm text-blush-500 hover:text-blush-600 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product: ProductCardData) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customer Reviews */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">💕 Happy Customers</h2>
            <p className="section-subtitle">What our lovely customers say</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((review, i) => (
              <div key={i} className="bg-ivory rounded-2xl p-6 border border-blush-100">
                <div className="flex mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-plum/70 text-sm leading-relaxed mb-4">
                  &ldquo;{review.text}&rdquo;
                </p>
                <p className="font-semibold text-plum text-sm">— {review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section id="brand-story" className="py-16 md:py-20 bg-gradient-to-b from-blush-50 to-ivory">
        <div className="container-narrow text-center">
          <span className="text-5xl mb-6 block">💌</span>
          <h2 className="section-title mb-4">Our Story</h2>
          <p className="text-plum/70 text-lg leading-relaxed mb-4">
            Craftlove01 was born from a simple belief — that a thoughtfully chosen gift can make
            someone&apos;s day a little brighter, a little more magical.
          </p>
          <p className="text-plum/60 leading-relaxed mb-4">
            We curate beautiful Korean earrings, cute jewellery, adorable scrunchies,
            and heartfelt gift hampers — every piece chosen with care, every box packed
            with love. Whether you&apos;re gifting a best friend, a partner, or treating
            yourself, we&apos;ve got something just right.
          </p>
          <p className="text-plum/60 leading-relaxed mb-8">
            Based in India 🇮🇳 | Shipping pan-India | DM us for custom gifting
          </p>
          <Link href="/products" className="btn-gold">
            Explore Our Collection
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-20 bg-white">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="bg-ivory rounded-2xl border border-blush-100 group"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium text-plum list-none">
                  {faq.q}
                  <span className="text-gold group-open:rotate-45 transition-transform duration-200 text-xl leading-none">+</span>
                </summary>
                <div className="px-6 pb-4 text-plum/60 text-sm leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram / Social CTA */}
      <section className="py-16 bg-ivory">
        <div className="container-narrow text-center">
          <span className="text-4xl mb-4 block">📸</span>
          <h2 className="section-title mb-2">Follow Our Journey</h2>
          <p className="section-subtitle mb-6">
            Tag us @craftlove01 on Instagram for a chance to be featured!
          </p>
          <a
            href="https://instagram.com/craftlove01"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            @craftlove01 on Instagram
          </a>
        </div>
      </section>
    </div>
  );
}
