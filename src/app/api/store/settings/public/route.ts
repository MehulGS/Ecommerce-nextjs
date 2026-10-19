import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StoreSettings from '@/models/StoreSettings';

export async function GET() {
  try {
    await connectDB();
    const settings = await StoreSettings.findOne()
      .select(
        'storeName tagline paymentMode announcement announcementActive ' +
        'freeShippingThreshold standardShippingCharge expressShippingCharge ' +
        'estimatedDeliveryDays returnPolicy instagramUrl instagramUsername whatsappNumber'
      )
      .lean();

    if (!settings) {
      return NextResponse.json({
        storeName: 'Craftlove01',
        paymentMode: 'static_qr',
        freeShippingThreshold: 999,
        standardShippingCharge: 79,
        expressShippingCharge: 149,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Store settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
