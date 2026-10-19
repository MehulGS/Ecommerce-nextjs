'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProductSortProps {
  currentSort?: string;
}

const sortOptions = [
  { label: 'Newest First', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export default function ProductSort({ currentSort }: ProductSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('sort', value);
    else params.delete('sort');
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <select
      value={currentSort ?? ''}
      onChange={(e) => handleSort(e.target.value)}
      className="input-field w-auto py-2 px-4 text-sm cursor-pointer"
      aria-label="Sort products"
    >
      {sortOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
