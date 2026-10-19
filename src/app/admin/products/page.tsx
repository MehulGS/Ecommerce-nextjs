import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Eye, EyeOff, Search } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { formatCurrency } from '@/lib/utils';
import AdminProductActions from '@/components/admin/AdminProductActions';

export const metadata: Metadata = {
  title: 'Products — Admin',
  robots: { index: false },
};

interface SearchParams {
  page?: string;
  search?: string;
  status?: string;
  stock?: string;
}

const PAGE_SIZE = 20;

async function getProducts(searchParams: SearchParams) {
  try {
    await connectDB();
        const query: any = {};

    if (searchParams.search) {
      query.$or = [
        { name: { $regex: searchParams.search, $options: 'i' } },
        { sku: { $regex: searchParams.search, $options: 'i' } },
      ];
    }

    if (searchParams.status === 'active') query.isActive = true;
    else if (searchParams.status === 'inactive') query.isActive = false;

    if (searchParams.stock === 'low') {
      query.stock = { $gt: 0, $lte: 5 };
      query.isActive = true;
    } else if (searchParams.stock === 'out') {
      query.$or = [{ isOutOfStock: true }, { stock: 0 }];
    }

    const page = Math.max(1, Number(searchParams.page ?? 1));
    const skip = (page - 1) * PAGE_SIZE;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      products: JSON.parse(JSON.stringify(products)),
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  } catch {
    return { products: [], total: 0, page: 1, totalPages: 0 };
  }
}

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { products, total, page, totalPages } = await getProducts(searchParams);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-plum">Products</h1>
          <p className="text-plum/50 text-sm">{total} total products</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush-50">
        <form className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-plum/40" />
            <input
              name="search"
              type="search"
              defaultValue={searchParams.search}
              placeholder="Search products or SKU..."
              className="input-field pl-10 py-2"
            />
          </div>
          <select name="status" defaultValue={searchParams.status ?? ''} className="input-field py-2 w-auto">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select name="stock" defaultValue={searchParams.stock ?? ''} className="input-field py-2 w-auto">
            <option value="">All Stock</option>
            <option value="low">Low Stock (≤5)</option>
            <option value="out">Out of Stock</option>
          </select>
          <button type="submit" className="btn-primary py-2 px-5">Filter</button>
          <Link href="/admin/products" className="btn-secondary py-2 px-5">Clear</Link>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-blush-50 overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-blush-200 mx-auto mb-4" />
            <p className="text-plum/50">No products found. <Link href="/admin/products/new" className="text-blush-500">Add your first product!</Link></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blush-50 text-plum/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">SKU</th>
                  <th className="text-left px-5 py-3">Price</th>
                  <th className="text-left px-5 py-3">Stock</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-50">
                {products.map((product: {
                  _id: string;
                  name: string;
                  slug: string;
                  sku: string;
                  price: number;
                  originalPrice?: number;
                  images: Array<{ url: string }>;
                  stock: number;
                  isActive: boolean;
                  isOutOfStock: boolean;
                  isFeatured: boolean;
                  isBestseller: boolean;
                  category?: { name: string };
                }) => (
                  <tr key={product._id} className="hover:bg-blush-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-blush-50 flex-shrink-0">
                          {product.images[0]?.url ? (
                            <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🎁</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-plum">{product.name}</p>
                          <p className="text-xs text-plum/40">{product.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-plum/60 font-mono text-xs">{product.sku}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-plum">{formatCurrency(product.price)}</p>
                      {product.originalPrice && (
                        <p className="text-xs text-plum/40 line-through">{formatCurrency(product.originalPrice)}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-medium ${
                        product.stock === 0 || product.isOutOfStock ? 'text-red-500' :
                        product.stock <= 5 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {product.isOutOfStock ? 'Out' : product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`badge text-xs ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {product.isBestseller && <span className="badge bg-peach-100 text-gold-dark text-xs">Bestseller</span>}
                        {product.isFeatured && <span className="badge bg-lavender-100 text-plum text-xs">Featured</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product._id}/edit`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blush-50 text-plum/60 hover:text-plum transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blush-50 text-plum/60 hover:text-plum transition-colors"
                          title="View on store"
                        >
                          {product.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Link>
                        <AdminProductActions productId={product._id} isActive={product.isActive} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center py-4 gap-2 border-t border-blush-50">
            {Array.from({ length: totalPages }).map((_, i) => (
              <a
                key={i}
                href={`?${new URLSearchParams({ ...searchParams, page: String(i + 1) })}`}
                className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  page === i + 1 ? 'bg-plum text-ivory' : 'hover:bg-blush-50 text-plum'
                }`}
              >
                {i + 1}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Needed for the import
function Package({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20.91 8.84L8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.12 2.12 0 0 0-.05 3.69l12.22 6.93a2 2 0 0 0 1.94 0L21 12.51a2.12 2.12 0 0 0-.09-3.67z" />
      <path d="M3.09 8.84L5 10.12 2.12 11.91a2.12 2.12 0 0 0-.09 3.67l12.34 6.61a1.93 1.93 0 0 0 1.81 0l2.75-1.48a2.12 2.12 0 0 0 .05-3.69L16.47 15" />
    </svg>
  );
}

