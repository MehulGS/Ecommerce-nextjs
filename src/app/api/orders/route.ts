import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import StoreSettings from '@/models/StoreSettings';
import Coupon from '@/models/Coupon';
import { generateOrderNumber, generateIdempotencyKey } from '@/lib/utils';

const customerSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10).max(20),
  email: z.string().email(),
  instagramUsername: z.string().optional(),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  country: z.string().default('India'),
});

const orderSchema = z.object({
  customer: customerSchema,
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive().max(99),
  })).min(1).max(50),
  paymentMethod: z.literal('static_qr'),
  shippingMethod: z.enum(['standard', 'express']).default('standard'),
  notes: z.string().max(500).optional(),
  couponCode: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customer, items, shippingMethod, notes, couponCode } = parsed.data;

    await connectDB();

    const settings = await StoreSettings.findOne().lean();
    const freeShippingThreshold = settings?.freeShippingThreshold ?? 999;
    const standardShipping = settings?.standardShippingCharge ?? 79;
    const expressShipping = settings?.expressShippingCharge ?? 149;

    // Validate products and calculate server-side prices
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = [];
    let subtotal = 0;
    let productDiscount = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 400 });
      }
      if (!product.isActive) {
        return NextResponse.json(
          { error: `"${product.name}" is no longer available` },
          { status: 400 }
        );
      }
      if (product.isOutOfStock || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `"${product.name}" is out of stock or has insufficient quantity` },
          { status: 400 }
        );
      }

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      if (product.originalPrice && product.originalPrice > product.price) {
        productDiscount += (product.originalPrice - product.price) * item.quantity;
      }

      orderItems.push({
        product: product._id,
        productSnapshot: {
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          image: product.images[0]?.url ?? '',
          price: product.price,
          originalPrice: product.originalPrice,
        },
        quantity: item.quantity,
        unitPrice: product.price,
        total: lineTotal,
      });
    }

    // Shipping
    const freeShipping = subtotal >= freeShippingThreshold;
    const shippingCharge = freeShipping
      ? 0
      : shippingMethod === 'express'
      ? expressShipping
      : standardShipping;

    // Coupon
    let couponDiscount = 0;
    let appliedCouponCode: string | undefined;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        $or: [
          { validUntil: { $exists: false } },
          { validUntil: null },
          { validUntil: { $gte: new Date() } },
        ],
      });

      if (coupon) {
        if (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount) {
          if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
            couponDiscount =
              coupon.type === 'percentage'
                ? Math.round((subtotal * coupon.value) / 100)
                : coupon.value;
            if (coupon.maxDiscountAmount) {
              couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
            }
            appliedCouponCode = coupon.code;
          }
        }
      }
    }

    const total = Math.max(0, subtotal + shippingCharge - couponDiscount);

    // Create order
    const orderNumber = generateOrderNumber();
    const idempotencyKey = generateIdempotencyKey();

    const order = await Order.create({
      orderNumber,
      customer,
      items: orderItems,
      subtotal,
      productDiscount,
      shippingCharge,
      couponDiscount,
      total,
      paymentMethod: 'static_qr',
      paymentStatus: 'pending',
      fulfilmentStatus: 'pending',
      notes,
      couponCode: appliedCouponCode,
      idempotencyKey,
      inventoryDeducted: false,
    });

    // Return QR settings so the checkout page can display them
    const qrSettings = settings
      ? {
          staticQrImageUrl: settings.staticQrImageUrl,
          paymentInstructions: settings.paymentInstructions,
          upiId: settings.upiId,
        }
      : undefined;

    return NextResponse.json(
      {
        success: true,
        order: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          total: order.total,
          storeSettings: qrSettings,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Order creation error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'Duplicate order prevented' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// Admin: list orders
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    await connectDB();

    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Number(searchParams.get('limit') ?? 20);
    const paymentStatus = searchParams.get('paymentStatus');
    const fulfilmentStatus = searchParams.get('fulfilmentStatus');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (fulfilmentStatus) query.fulfilmentStatus = fulfilmentStatus;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      orders: JSON.parse(JSON.stringify(orders)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
