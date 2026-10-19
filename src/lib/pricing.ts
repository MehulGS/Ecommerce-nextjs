import { IProduct } from '@/models/Product';
import StoreSettings from '@/models/StoreSettings';
import connectDB from '@/lib/mongodb';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface PriceBreakdown {
  subtotal: number;
  productDiscount: number;
  shippingCharge: number;
  couponDiscount: number;
  total: number;
  freeShipping: boolean;
  shippingMethod: 'standard' | 'express' | 'free';
}

export async function calculateOrderTotal(
  items: Array<{ product: IProduct; quantity: number }>,
  shippingMethod: 'standard' | 'express' = 'standard',
  couponDiscount = 0
): Promise<PriceBreakdown> {
  await connectDB();
  const settings = await StoreSettings.findOne().lean();

  const freeShippingThreshold = settings?.freeShippingThreshold ?? 999;
  const standardShippingCharge = settings?.standardShippingCharge ?? 79;
  const expressShippingCharge = settings?.expressShippingCharge ?? 149;

  let subtotal = 0;
  let productDiscount = 0;

  for (const { product, quantity } of items) {
    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    if (product.originalPrice && product.originalPrice > product.price) {
      productDiscount += (product.originalPrice - product.price) * quantity;
    }
  }

  const freeShipping = subtotal >= freeShippingThreshold;
  let shippingCharge = 0;
  if (!freeShipping) {
    shippingCharge =
      shippingMethod === 'express' ? expressShippingCharge : standardShippingCharge;
  }

  const total = Math.max(0, subtotal + shippingCharge - couponDiscount);

  return {
    subtotal,
    productDiscount,
    shippingCharge,
    couponDiscount,
    total,
    freeShipping,
    shippingMethod: freeShipping ? 'free' : shippingMethod,
  };
}
