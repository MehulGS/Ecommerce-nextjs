import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { getAdminFromRequest } from '@/lib/auth';

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  slug: z.string().min(2).max(200).optional(),
  description: z.string().min(10).optional(),
  shortDescription: z.string().max(300).optional(),
  images: z.array(z.object({
    // Allow both absolute HTTPS URLs (legacy/external) and relative /uploads/... paths
    url: z.string().min(1),
    alt: z.string().optional(),
    sortOrder: z.number(),
  })).optional(),
  category: z.string().optional(),
  sku: z.string().min(2).max(50).optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isOutOfStock: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  specifications: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  weight: z.number().positive().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    await connectDB();

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (updateData.sku) updateData.sku = (updateData.sku as string).toUpperCase();

    // Auto-set out of stock if stock becomes 0
    if (typeof updateData.stock === 'number' && updateData.stock === 0) {
      updateData.isOutOfStock = true;
    } else if (typeof updateData.stock === 'number' && updateData.stock > 0 && updateData.isOutOfStock === undefined) {
      updateData.isOutOfStock = false;
    }

    const product = await Product.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: JSON.parse(JSON.stringify(product)) });
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    await connectDB();

    const product = await Product.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product patch error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const product = await Product.findById(params.id).populate('category', 'name slug').lean();
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ product: JSON.parse(JSON.stringify(product)) });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const product = await Product.findByIdAndUpdate(params.id, { isActive: false });
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
