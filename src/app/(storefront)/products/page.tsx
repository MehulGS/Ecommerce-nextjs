import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { SlidersHorizontal } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import ProductCard, { ProductCardData } from '@/components/ui/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import ProductSort from '@/components/product/ProductSort';

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse our complete collection of Korean earrings, cute jewellery, scrunchies, accessories and gift hampers.',
};

interface SearchParams {
  category?: string;
  search?: string;
  filter?: string;
  maxPrice?: string;
  minPrice?: string;
  sort?: string;
  page?: string;
  tag?: string;
}

interface PageProps {
  searchParams: SearchParams;
}

const PAGE_SIZE = 20;

async function getProducts(searchParams: SearchParams) {
  try {
    await connectDB();

    // Build query
        const query: any = { isActive: true };

    // Search
    if (searchParams.search) {
      query.$text = { $search: searchParams.search };
    }

    // Category filter
    if (searchParams.category) {
      const cat = await Category.findOne({ slug: searchParams.category, isActive: true }).lean();
      if (cat) query.category = cat._id;
    }

    // Tag filter
    if (searchParams.tag) {
      query.tags = { $in: [searchParams.tag] };
    }

    // Price filters
    if (searchParams.maxPrice) {
      query.price = { ...query.price, $lte: Number(searchParams.maxPrice) };
    }
    if (searchParams.minPrice) {
      query.price = { ...query.price, $gte: Number(searchParams.minPrice) };
    }

    // Special filters
    if (searchParams.filter === 'new') {
      // last 30 days
      query.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (searchParams.filter === 'bestsellers') {
      query.isBestseller = true;
    } else if (searchParams.filter === 'featured') {
      query.isFeatured = true;
    } else if (searchParams.filter === 'sale') {
      query.originalPrice = { $exists: true, $gt: 0 };
    }

    // Sort
        let sort: any = { createdAt: -1 };
    if (searchParams.sort === 'price_asc') sort = { price: 1 };
    else if (searchParams.sort === 'price_desc') sort = { price: -1 };
    else if (searchParams.sort === 'oldest') sort = { createdAt: 1 };

    const page = Math.max(1, Number(searchParams.page ?? 1));
    const skip = (page - 1) * PAGE_SIZE;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sort)
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

async function getCategories() {
  try {
    await connectDB();
    const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    return JSON.parse(JSON.stringify(cats));
  } catch { return []; }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const [{ products, total, page, totalPages }, categories] = await Promise.all([
    getProducts(searchParams),
    getCategories(),
  ]);

  const hasFilters = !!(
    searchParams.category ||
    searchParams.search ||
    searchParams.filter ||
    searchParams.maxPrice ||
    searchParams.minPrice ||
    searchParams.tag
  );

  return (
    <div className="bg-ivory min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-blush-100 py-8">
        <div className="container-wide">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-plum">
            {searchParams.search
              ? `Search: "${searchParams.search}"`
              : searchParams.category
              ? categories.find((c: {slug: string; name: string}) => c.slug === searchParams.category)?.name ?? 'Products'
              : searchParams.filter === 'bestsellers' ? '✨ Bestsellers'
              : searchParams.filter === 'new' ? '🆕 New Arrivals'
              : 'All Products'}
          </h1>
          <p className="text-plum/50 mt-1">
            {total} product{total !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      <div className="container-wide py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilters
              categories={categories}
              currentCategory={searchParams.category}
              currentFilter={searchParams.filter}
              currentMaxPrice={searchParams.maxPrice}
              currentMinPrice={searchParams.minPrice}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm text-plum/50">
                <SlidersHorizontal className="w-4 h-4" />
                <span>{total} products</span>
              </div>
              <ProductSort currentSort={searchParams.sort} />
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                  {products.map((product: ProductCardData) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12 gap-2">
                    {page > 1 && (
                      <a
                        href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                        className="btn-secondary px-5 py-2.5"
                      >
                        Previous
                      </a>
                    )}
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <a
                        key={i}
                        href={`?${new URLSearchParams({ ...searchParams, page: String(i + 1) })}`}
                        className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition-colors ${
                          page === i + 1
                            ? 'bg-plum text-ivory'
                            : 'bg-white text-plum hover:bg-blush-50 border border-blush-100'
                        }`}
                      >
                        {i + 1}
                      </a>
                    ))}
                    {page < totalPages && (
                      <a
                        href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                        className="btn-secondary px-5 py-2.5"
                      >
                        Next
                      </a>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <span className="text-6xl block mb-4">🔍</span>
                <h2 className="font-serif text-2xl text-plum mb-2">No products found</h2>
                <p className="text-plum/50 mb-6">
                  {hasFilters
                    ? 'Try adjusting your filters or search term'
                    : 'Check back soon for new products!'}
                </p>
                {hasFilters && (
                  <a href="/products" className="btn-primary">
                    Clear Filters
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

