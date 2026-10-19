import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit Product — Admin',
  robots: { index: false },
};

async function getData(id: string) {
  try {
    await connectDB();
    const [product, categories] = await Promise.all([
      Product.findById(id).populate('category', 'name slug').lean(),
      Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    ]);
    return {
      product: product ? JSON.parse(JSON.stringify(product)) : null,
      categories: JSON.parse(JSON.stringify(categories)),
    };
  } catch {
    return { product: null, categories: [] };
  }
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { product, categories } = await getData(params.id);

  if (!product) notFound();

  // Normalize category to string ID
  const normalizedProduct = {
    ...product,
    category: product.category?._id?.toString() ?? product.category?.toString() ?? '',
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-plum">Edit Product</h1>
        <p className="text-plum/50 text-sm">{product.name}</p>
      </div>
      <ProductForm categories={categories} product={normalizedProduct} />
    </div>
  );
}
