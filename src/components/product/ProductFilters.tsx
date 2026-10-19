'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  currentCategory?: string;
  currentFilter?: string;
  currentMaxPrice?: string;
  currentMinPrice?: string;
}

const priceRanges = [
  { label: 'Under ₹299', max: 299 },
  { label: 'Under ₹499', max: 499 },
  { label: '₹499 – ₹999', min: 499, max: 999 },
  { label: 'Above ₹999', min: 999 },
];

const specialFilters = [
  { label: '🆕 New Arrivals', value: 'new' },
  { label: '✨ Bestsellers', value: 'bestsellers' },
  { label: '🏷️ On Sale', value: 'sale' },
  { label: '⭐ Featured', value: 'featured' },
];

export default function ProductFilters({
  categories,
  currentCategory,
  currentFilter,
  currentMaxPrice,
  currentMinPrice,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const hasActiveFilters = currentCategory || currentFilter || currentMaxPrice || currentMinPrice;

  return (
    <div className="space-y-2">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={() => router.push('/products')}
          className="flex items-center gap-1.5 text-sm text-blush-500 hover:text-blush-600 font-medium mb-4"
        >
          <X className="w-4 h-4" />
          Clear all filters
        </button>
      )}

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-blush-100 overflow-hidden">
        <button
          onClick={() => setCategoryOpen(!categoryOpen)}
          className="flex items-center justify-between w-full px-5 py-4 font-medium text-plum"
        >
          Categories
          {categoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {categoryOpen && (
          <div className="px-5 pb-4 space-y-1.5">
            <button
              onClick={() => updateFilter('category', undefined)}
              className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                !currentCategory
                  ? 'bg-plum text-ivory font-medium'
                  : 'text-plum/70 hover:bg-blush-50 hover:text-plum'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => updateFilter('category', cat.slug)}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  currentCategory === cat.slug
                    ? 'bg-plum text-ivory font-medium'
                    : 'text-plum/70 hover:bg-blush-50 hover:text-plum'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Special Filters */}
      <div className="bg-white rounded-2xl border border-blush-100 overflow-hidden">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center justify-between w-full px-5 py-4 font-medium text-plum"
        >
          Filter
          {filterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {filterOpen && (
          <div className="px-5 pb-4 space-y-1.5">
            {specialFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => updateFilter('filter', currentFilter === f.value ? undefined : f.value)}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  currentFilter === f.value
                    ? 'bg-plum text-ivory font-medium'
                    : 'text-plum/70 hover:bg-blush-50 hover:text-plum'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="bg-white rounded-2xl border border-blush-100 overflow-hidden">
        <button
          onClick={() => setPriceOpen(!priceOpen)}
          className="flex items-center justify-between w-full px-5 py-4 font-medium text-plum"
        >
          Price Range
          {priceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {priceOpen && (
          <div className="px-5 pb-4 space-y-1.5">
            {priceRanges.map((range) => {
              const isActive =
                String(currentMaxPrice) === String(range.max) &&
                String(currentMinPrice ?? '') === String(range.min ?? '');
              return (
                <button
                  key={range.label}
                  onClick={() => {
                    if (isActive) {
                      const p = new URLSearchParams(searchParams.toString());
                      p.delete('maxPrice');
                      p.delete('minPrice');
                      p.delete('page');
                      router.push(`/products?${p.toString()}`);
                    } else {
                      const p = new URLSearchParams(searchParams.toString());
                      if (range.max) p.set('maxPrice', String(range.max));
                      else p.delete('maxPrice');
                      if (range.min) p.set('minPrice', String(range.min));
                      else p.delete('minPrice');
                      p.delete('page');
                      router.push(`/products?${p.toString()}`);
                    }
                  }}
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-plum text-ivory font-medium'
                      : 'text-plum/70 hover:bg-blush-50 hover:text-plum'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
