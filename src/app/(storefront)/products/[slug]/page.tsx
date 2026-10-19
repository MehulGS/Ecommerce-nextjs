import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import ProductDetail from '@/components/product/ProductDetail';
import ProductCard, { ProductCardData } from '@/components/ui/ProductCard';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connectDB();
  const product = await Product.findOne({ slug: params.slug, isActive: true })
    .populate('category', 'name')
    .lean();

  if (!product) return { title: 'Product Not Found' };

  return {
    title: product.name,
    description: product.shortDescription ?? product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? product.description.substring(0, 160),
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

async function getProduct(slug: string) {
  await connectDB();
  const product = await Product.findOne({ slug, isActive: true })
    .populate('category', 'name slug')
    .lean();
  return product ? JSON.parse(JSON.stringify(product)) : null;
}

async function getRelatedProducts(categoryId: string, productId: string) {
  await connectDB();
  const products = await Product.find({
    category: categoryId,
    isActive: true,
    _id: { $ne: productId },
  })
    .populate('category', 'name slug')
    .limit(4)
    .lean();
  return JSON.parse(JSON.stringify(products));
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(
    product.category._id,
    product._id
  );

  return (
    <div className="bg-ivory">
      <ProductDetail product={product} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container-wide">
            <h2 className="section-title mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p: ProductCardData) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
