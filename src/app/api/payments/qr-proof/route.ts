/**
 * POST /api/payments/qr-proof
 *
 * Public endpoint — customers submit their payment screenshot.
 * Stores the proof file under /uploads/payment-proofs/ (outside public/).
 * Only admins can retrieve proof images via /api/admin/payment-proof/[filename].
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { saveUploadedFile } from '@/lib/upload';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const orderId = formData.get('orderId');
    const proofFile = formData.get('proof');
    const upiRef = formData.get('upiRef'); // optional customer-supplied UTR

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }
    if (!proofFile || !(proofFile instanceof File)) {
      return NextResponse.json({ error: 'Missing proof file' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentMethod !== 'static_qr') {
      return NextResponse.json({ error: 'Not a QR payment order' }, { status: 400 });
    }

    // Idempotency: don't accept a second submission once verification or payment is done
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Payment already confirmed' }, { status: 409 });
    }
    if (order.paymentStatus === 'verification_required') {
      return NextResponse.json(
        { error: 'Payment proof already submitted. Awaiting admin verification.' },
        { status: 409 }
      );
    }

    // Save the proof file to the private uploads directory
    const result = await saveUploadedFile(proofFile, { category: 'payment-proofs' });

    if (!result.ok) {
      const status =
        result.error.code === 'INVALID_TYPE'
          ? 415
          : result.error.code === 'TOO_LARGE'
          ? 413
          : 500;
      return NextResponse.json({ error: result.error.message }, { status });
    }

    // Store only the filename (not a full filesystem path) in MongoDB
    const proofFilename = result.value.filename;
    const upiReference =
      typeof upiRef === 'string' && upiRef.trim() ? upiRef.trim() : undefined;

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'verification_required',
      // We store just the filename; the admin API route resolves it to the full path
      qrPaymentProofUrl: `/api/admin/payment-proof/${proofFilename}`,
      // Re-use the publicId field to record the UTR supplied by the customer
      qrPaymentProofPublicId: upiReference ?? '',
      paymentReference: upiReference,
    });

    return NextResponse.json({
      success: true,
      message:
        'Payment proof submitted. We will verify your payment and confirm your order shortly.',
    });
  } catch (error) {
    console.error('[qr-proof] Error:', error);
    return NextResponse.json({ error: 'Failed to submit proof' }, { status: 500 });
  }
}
