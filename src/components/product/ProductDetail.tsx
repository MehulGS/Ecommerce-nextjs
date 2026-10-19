'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Minus, Plus, Share2, Truck, Shield, RefreshCw, ChevronRight, ZoomIn } from 'lucide-react';
import { formatCurrency, calculateDiscountPercentage } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';

interface ProductSpec {
  key: string;
  value: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: Array<{ url: string; alt?: string; publicId?: string }>;
  category: { _id: string; name: string; slug: string };
  sku: string;
  price: number;
  originalPrice?: number;
  stock: number;
  isActive: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  tags: string[];
  specifications: ProductSpec[];
  weight?: number;
}

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'shipping'>('description');
  const { addItem, openCart } = useCart();

  const canPurchase = !product.isOutOfStock && product.stock > 0;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? calculateDiscountPercentage(product.originalPrice, product.price)
      : 0;

  const handleAddToCart = () => {
    if (!canPurchase) return;
    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? '',
      price: product.price,
      originalPrice: product.originalPrice,
      quantity,
      sku: product.sku,
    });
    toast.success(`Added to bag! 🛍️`);
    openCart();
  };

  const handleBuyNow = () => {
    if (!canPurchase) return;
    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? '',
      price: product.price,
      originalPrice: product.originalPrice,
      quantity,
      sku: product.sku,
    });
    window.location.href = '/checkout';
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const selectedImage = product.images[selectedImageIndex];

  return (
    <div className="container-wide py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-plum/50 mb-8">
        <Link href="/" className="hover:text-plum transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-plum transition-colors">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-plum transition-colors">
          {product.category.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-plum truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div
            className="relative aspect-square rounded-3xl overflow-hidden bg-blush-50 cursor-zoom-in group"
            onClick={() => setLightboxOpen(true)}
          >
            {selectedImage ? (
              <Image
                src={selectedImage.url}
                alt={selectedImage.alt ?? product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized={selectedImage.url.startsWith('/uploads/')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl">🎁</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {!canPurchase && (
                <span className="badge-outofstock px-3 py-1">Out of Stock</span>
              )}
              {discountPercent > 0 && canPurchase && (
                <span className="badge-sale px-3 py-1">-{discountPercent}%</span>
              )}
              {product.isBestseller && (
                <span className="badge-bestseller px-3 py-1">Bestseller</span>
              )}
            </div>

            {/* Zoom hint */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-full p-2">
              <ZoomIn className="w-4 h-4 text-plum" />
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                    i === selectedImageIndex
                      ? 'border-plum shadow-card'
                      : 'border-blush-100 hover:border-blush-300'
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? `${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized={img.url.startsWith('/uploads/')}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category & Title */}
          <div>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-sm text-blush-500 hover:text-blush-600 font-medium uppercase tracking-wide"
            >
              {product.category.name}
            </Link>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-plum mt-2 leading-tight">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="text-plum/60 mt-3 leading-relaxed">{product.shortDescription}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end gap-4">
            <span className="text-3xl font-serif font-bold text-plum">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="price-original text-lg">
                  {formatCurrency(product.originalPrice)}
                </span>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          {/* SKU & Stock */}
          <div className="flex items-center gap-6 text-sm text-plum/50">
            <span>SKU: <span className="font-medium text-plum">{product.sku}</span></span>
            <span>
              {canPurchase ? (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                  In Stock ({product.stock})
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500">
                  <span className="w-2 h-2 bg-red-400 rounded-full inline-block" />
                  Out of Stock
                </span>
              )}
            </span>
          </div>

          {/* Quantity & Add to Cart */}
          {canPurchase && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="label mb-0">Quantity</label>
                <div className="flex items-center bg-blush-50 rounded-full px-2 py-1.5 gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blush-200 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4 text-plum" />
                  </button>
                  <span className="w-8 text-center font-medium text-plum">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blush-200 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4 text-plum" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleAddToCart} className="btn-primary flex-1">
                  <ShoppingBag className="w-5 h-5" />
                  Add to Bag
                </button>
                <button onClick={handleBuyNow} className="btn-gold flex-1">
                  Buy Now
                </button>
              </div>
            </div>
          )}

          {!canPurchase && (
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-gray-500 font-medium">This item is currently out of stock.</p>
              <p className="text-sm text-gray-400 mt-1">Check back later or explore similar items below.</p>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/products?tag=${tag}`}
                  className="px-3 py-1 bg-blush-50 text-plum/70 text-xs rounded-full hover:bg-blush-100 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-blush-100">
            {[
              { icon: <Truck className="w-5 h-5" />, label: 'Free ship ₹999+' },
              { icon: <Shield className="w-5 h-5" />, label: 'Secure Payment' },
              { icon: <RefreshCw className="w-5 h-5" />, label: '7-day Returns' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-gold">{item.icon}</span>
                <span className="text-xs text-plum/60">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-plum/50 hover:text-plum transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share this product
          </button>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-14">
        <div className="flex border-b border-blush-100 mb-8">
          {[
            { id: 'description' as const, label: 'Description' },
            { id: 'specs' as const, label: 'Specifications' },
            { id: 'shipping' as const, label: 'Shipping & Returns' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-plum text-plum'
                  : 'border-transparent text-plum/50 hover:text-plum'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-w-3xl">
          {activeTab === 'description' && (
            <div className="prose prose-sm text-plum/70 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
          )}

          {activeTab === 'specs' && (
            <div>
              {product.specifications.length > 0 ? (
                <div className="space-y-3">
                  {product.specifications.map((spec, i) => (
                    <div key={i} className="flex gap-4 py-3 border-b border-blush-50">
                      <span className="font-medium text-plum w-40 flex-shrink-0">{spec.key}</span>
                      <span className="text-plum/70">{spec.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-plum/50">No specifications available.</p>
              )}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4 text-plum/70 text-sm leading-relaxed">
              <div>
                <h3 className="font-semibold text-plum mb-2">Shipping</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Standard delivery: 5-7 business days</li>
                  <li>Express delivery: 2-3 business days (additional charges apply)</li>
                  <li>Free shipping on orders above ₹999</li>
                  <li>Standard shipping: ₹79</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-plum mb-2">Returns & Refunds</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Returns accepted within 7 days for damaged or incorrect items</li>
                  <li>Customised items are non-returnable</li>
                  <li>Please DM us on Instagram or email us to initiate a return</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-plum/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-2xl w-full aspect-square">
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt ?? product.name}
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized={selectedImage.url.startsWith('/uploads/')}
            />
          </div>
          <button
            className="absolute top-4 right-4 text-ivory text-2xl w-10 h-10 flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
