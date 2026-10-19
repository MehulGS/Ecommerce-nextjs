import { NextResponse } from 'next/server';

// Razorpay has been removed. This endpoint is no longer in use.
export async function POST() {
  return NextResponse.json(
    { error: 'Razorpay is not enabled on this store.' },
    { status: 410 }
  );
}
