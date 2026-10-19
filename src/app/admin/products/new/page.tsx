import React from 'react';
import type { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Add Product — Admin',
  robots: { index: false },
};

async function getCategories() {
  try {
    await connectDB();
    const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    return JSON.parse(JSON.stringify(cats));
  } catch { return []; }
}

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-plum">Add New Product</h1>
        <p className="text-plum/50 text-sm">Fill in the details to add a new product</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
