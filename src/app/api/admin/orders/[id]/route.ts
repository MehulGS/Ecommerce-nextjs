import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { getAdminFromRequest } from '@/lib/auth';
import { deductInventory, restoreInventory } from '@/lib/inventory';

const updateSchema = z.object({
  paymentStatus: z.enum(['pending', 'verification_required', 'paid', 'failed', 'rejected', 'refund_pending', 'refunded']).optional(),
  fulfilmentStatus: z.enum(['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled']).optional(),
  shippingCarrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  adminNotes: z.string().optional(),
  refundReference: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(params.id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Guard: prevent confirming an order that is already paid, cancelled, or refunded
    if (
      parsed.data.paymentStatus === 'paid' &&
      ['paid', 'rejected', 'cancelled', 'refunded'].includes(order.paymentStatus)
    ) {
      return NextResponse.json(
        {
          error: `Cannot mark as paid — current status is "${order.paymentStatus}". Contact support if this is an error.`,
        },
        { status: 409 }
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    // If verifying QR payment: deduct inventory
    if (
      parsed.data.paymentStatus === 'paid' &&
      order.paymentStatus !== 'paid' &&
      !order.inventoryDeducted
    ) {
      const stockItems = order.items.map((item) => ({
        productId: item.product.toString(),
        quantity: item.quantity,
      }));
      const { success } = await deductInventory(stockItems, params.id);
      if (success) {
        updateData.inventoryDeducted = true;
      }
    }

    // If cancelling: restore inventory if was deducted
    if (
      parsed.data.fulfilmentStatus === 'cancelled' &&
      order.fulfilmentStatus !== 'cancelled' &&
      order.inventoryDeducted
    ) {
      const stockItems = order.items.map((item) => ({
        productId: item.product.toString(),
        quantity: item.quantity,
      }));
      await restoreInventory(stockItems);
      updateData.inventoryDeducted = false;
    }

    const updated = await Order.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({ success: true, order: JSON.parse(JSON.stringify(updated)) });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
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
    const order = await Order.findById(params.id).lean();
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
