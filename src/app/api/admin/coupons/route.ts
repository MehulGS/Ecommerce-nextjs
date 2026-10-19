import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { getAdminFromRequest } from '@/lib/auth';

const schema = z.object({
  code: z.string().min(2).max(20).toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  validUntil: z.string().optional(),
  description: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    await connectDB();
    const existing = await Coupon.findOne({ code: parsed.data.code });
    if (existing) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });

    const coupon = await Coupon.create({
      ...parsed.data,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
    });

    return NextResponse.json({ success: true, coupon: JSON.parse(JSON.stringify(coupon)) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons: JSON.parse(JSON.stringify(coupons)) });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}
