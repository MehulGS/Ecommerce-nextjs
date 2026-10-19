import { NextResponse } from 'next/server';

// Razorpay has been removed. This webhook endpoint is no longer in use.
export async function POST() {
  return NextResponse.json(
    { error: 'Razorpay webhooks are not enabled on this store.' },
    { status: 410 }
  );
}
