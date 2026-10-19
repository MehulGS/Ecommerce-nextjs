import React from 'react';
import type { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import CategoryManager from '@/components/admin/CategoryManager';

export const metadata: Metadata = {
  title: 'Categories — Admin',
  robots: { index: false },
};

async function getCategories() {
  try {
    await connectDB();
    const cats = await Category.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
    return JSON.parse(JSON.stringify(cats));
  } catch { return []; }
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-plum">Categories</h1>
        <p className="text-plum/50 text-sm">Manage product categories</p>
      </div>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
