import React from 'react';
import type { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import CouponManager from '@/components/admin/CouponManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Coupons — Admin',
  robots: { index: false },
};

async function getCoupons() {
  try {
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(coupons));
  } catch { return []; }
}

export default async function CouponsPage() {
  const coupons = await getCoupons();
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-plum">Coupons</h1>
        <p className="text-plum/50 text-sm">Manage discount codes</p>
      </div>
      <CouponManager initialCoupons={coupons} />
    </div>
  );
}
