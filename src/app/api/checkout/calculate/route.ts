import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import StoreSettings from '@/models/StoreSettings';
import Coupon from '@/models/Coupon';

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  shippingMethod: z.enum(['standard', 'express']).default('standard'),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { items, shippingMethod, couponCode } = parsed.data;

    await connectDB();

    const settings = await StoreSettings.findOne().lean();
    const freeShippingThreshold = settings?.freeShippingThreshold ?? 999;
    const standardShipping = settings?.standardShippingCharge ?? 79;
    const expressShipping = settings?.expressShippingCharge ?? 149;

    // Fetch products
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    let productDiscount = 0;
    const errors: string[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }
      subtotal += product.price * item.quantity;
      if (product.originalPrice && product.originalPrice > product.price) {
        productDiscount += (product.originalPrice - product.price) * item.quantity;
      }
    }

    const freeShipping = subtotal >= freeShippingThreshold;
    let shippingCharge = 0;
    if (!freeShipping) {
      shippingCharge = shippingMethod === 'express' ? expressShipping : standardShipping;
    }

    // Coupon
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        $or: [{ validUntil: { $exists: false } }, { validUntil: null }, { validUntil: { $gte: new Date() } }],
      }).lean();

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
          }
        }
      }
    }

    const total = Math.max(0, subtotal + shippingCharge - couponDiscount);

    return NextResponse.json({
      breakdown: {
        subtotal,
        productDiscount,
        shippingCharge,
        couponDiscount,
        total,
        freeShipping,
      },
      errors,
    });
  } catch (error) {
    console.error('Calculate error:', error);
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
  }
}
