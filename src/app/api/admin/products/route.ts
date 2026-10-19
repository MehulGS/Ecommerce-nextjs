import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { getAdminFromRequest } from '@/lib/auth';
import { slugify } from '@/lib/utils';

const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).optional(),
  description: z.string().min(10),
  shortDescription: z.string().max(300).optional(),
  images: z.array(z.object({
    // Allow both absolute HTTPS URLs (legacy/external) and relative /uploads/... paths
    url: z.string().min(1),
    alt: z.string().optional(),
    sortOrder: z.number(),
  })).optional(),
  category: z.string().min(1),
  sku: z.string().min(2).max(50),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  isActive: z.boolean().default(true),
  isOutOfStock: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  specifications: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  weight: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    await connectDB();

    // Validate category exists
    const category = await Category.findById(data.category);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    // Generate slug if not provided
    const productSlug = data.slug ?? slugify(data.name);

    // Check unique slug
    const existingSlug = await Product.findOne({ slug: productSlug });
    if (existingSlug) {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 });
    }

    // Check unique SKU
    const existingSku = await Product.findOne({ sku: data.sku.toUpperCase() });
    if (existingSku) {
      return NextResponse.json({ error: 'A product with this SKU already exists' }, { status: 409 });
    }

    // Auto-set out of stock if stock is 0
    const isOutOfStock = data.isOutOfStock || data.stock === 0;

    const product = await Product.create({
      ...data,
      slug: productSlug,
      sku: data.sku.toUpperCase(),
      isOutOfStock,
    });

    return NextResponse.json({ success: true, product: JSON.parse(JSON.stringify(product)) }, { status: 201 });
  } catch (error: unknown) {
    console.error('Product creation error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'Duplicate SKU or slug' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const stock = searchParams.get('stock');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Number(searchParams.get('limit') ?? 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    if (stock === 'low') {
      query.stock = { $gt: 0, $lte: 5 };
      query.isActive = true;
    } else if (stock === 'out') {
      query.$or = [{ isOutOfStock: true }, { stock: 0 }];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      products: JSON.parse(JSON.stringify(products)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
