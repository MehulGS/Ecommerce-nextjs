import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StoreSettings from '@/models/StoreSettings';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    let settings = await StoreSettings.findOne().lean();
    if (!settings) {
      const created = await StoreSettings.create({});
      settings = created.toObject();
    }
    return NextResponse.json({ settings: JSON.parse(JSON.stringify(settings)) });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    await connectDB();

    // Strip any legacy Razorpay / Cloudinary fields that may arrive from old clients
    // eslint-disable-next-line no-unused-vars
    const { razorpayEnabled, staticQrImagePublicId, logoPublicId, ...safeBody } = body;

    const settings = await StoreSettings.findOneAndUpdate(
      {},
      { $set: safeBody },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, settings: JSON.parse(JSON.stringify(settings)) });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
