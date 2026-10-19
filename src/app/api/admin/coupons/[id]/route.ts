import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const coupon = await Coupon.findById(params.id).lean();
    if (!coupon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ coupon: JSON.parse(JSON.stringify(coupon)) });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch coupon' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    await connectDB();
    const coupon = await Coupon.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    if (!coupon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, coupon: JSON.parse(JSON.stringify(coupon)) });
  } catch {
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    await connectDB();
    const coupon = await Coupon.findByIdAndUpdate(params.id, { $set: body }, { new: true });
    if (!coupon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, coupon: JSON.parse(JSON.stringify(coupon)) });
  } catch {
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const coupon = await Coupon.findByIdAndDelete(params.id);
    if (!coupon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
