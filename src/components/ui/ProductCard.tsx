'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { formatCurrency, calculateDiscountPercentage } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';

export interface ProductCardData {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  images: Array<{ url: string; alt?: string }>;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  stock: number;
  category?: { name: string; slug: string };
  tags?: string[];
  sku: string;
}

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? calculateDiscountPercentage(product.originalPrice, product.price)
      : 0;

  const canPurchase = !product.isOutOfStock && product.stock > 0;
  const mainImage = product.images[0]?.url;
  const hoverImage = product.images[1]?.url;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canPurchase) return;

    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: mainImage ?? '',
      price: product.price,
      originalPrice: product.originalPrice,
      quantity: 1,
      sku: product.sku,
    });
    toast.success(`${product.name} added to bag! 🛍️`);
    openCart();
  };

  return (
    <Link href={`/products/${product.slug}`} className={`product-card block ${className}`}>
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-blush-50">
        {mainImage ? (
          <>
            <Image
              src={mainImage}
              alt={product.images[0]?.alt ?? product.name}
              fill
              className={`object-cover transition-all duration-500 ${hoverImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={mainImage.startsWith('/uploads/')}
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={product.name}
                fill
                className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized={hoverImage.startsWith('/uploads/')}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blush-50 to-lavender-50">
            <ShoppingBag className="w-12 h-12 text-blush-200" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isOutOfStock || product.stock <= 0 ? (
            <span className="badge-outofstock">Out of Stock</span>
          ) : discountPercent > 0 ? (
            <span className="badge-sale">-{discountPercent}%</span>
          ) : null}
          {product.isBestseller && <span className="badge-bestseller">Bestseller</span>}
          {product.isFeatured && !product.isBestseller && (
            <span className="badge-new">✨ Featured</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blush-100"
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
        >
          <Heart className="w-4 h-4 text-plum" />
        </button>

        {/* Add to Cart Overlay */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button
            onClick={handleAddToCart}
            disabled={!canPurchase}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              canPurchase
                ? 'bg-plum text-ivory hover:bg-plum-700 shadow-button'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            {canPurchase ? 'Add to Bag' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {product.category && (
          <p className="text-xs text-plum/40 uppercase tracking-wide mb-1">
            {product.category.name}
          </p>
        )}
        <h3 className="font-medium text-plum text-sm leading-snug line-clamp-2 mb-2 group-hover:text-blush-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-plum">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="price-original">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          {discountPercent > 0 && (
            <span className="text-xs font-medium text-green-600">
              {discountPercent}% off
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
