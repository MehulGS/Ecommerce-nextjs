import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { getAdminFromRequest } from '@/lib/auth';
import { slugify } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).optional(),
  description: z.string().max(300).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    await connectDB();
    const catSlug = parsed.data.slug ?? slugify(parsed.data.name);
    const existing = await Category.findOne({ slug: catSlug });
    if (existing) return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 409 });

    const category = await Category.create({ ...parsed.data, slug: catSlug });
    return NextResponse.json({ success: true, category: JSON.parse(JSON.stringify(category)) }, { status: 201 });
  } catch (error) {
    console.error('Category create error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const all = new URL(req.url).searchParams.get('all') === 'true';
    const query = all ? {} : { isActive: true };
    const cats = await Category.find(query).sort({ sortOrder: 1, name: 1 }).lean();
    return NextResponse.json({ categories: JSON.parse(JSON.stringify(cats)) });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
