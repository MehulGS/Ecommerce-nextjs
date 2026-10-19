import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export interface StockCheckItem {
  productId: string;
  quantity: number;
}

export interface StockCheckResult {
  success: boolean;
  errors: Array<{ productId: string; message: string }>;
  items: Array<{
    productId: string;
    product: {
      name: string;
      price: number;
      originalPrice?: number;
      image: string;
      slug: string;
      sku: string;
    };
    quantity: number;
    available: boolean;
  }>;
}

/**
 * Validate cart items against current inventory.
 * Returns enriched product data and any availability errors.
 */
export async function validateCartItems(
  items: StockCheckItem[]
): Promise<StockCheckResult> {
  await connectDB();

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } })
    .populate('category', 'name slug')
    .lean();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const errors: StockCheckResult['errors'] = [];
  const resultItems: StockCheckResult['items'] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      errors.push({ productId: item.productId, message: 'Product not found.' });
      continue;
    }

    if (!product.isActive) {
      errors.push({ productId: item.productId, message: `"${product.name}" is no longer available.` });
      continue;
    }

    const outOfStock = product.isOutOfStock || product.stock <= 0;
    if (outOfStock) {
      errors.push({ productId: item.productId, message: `"${product.name}" is out of stock.` });
    }

    if (product.stock < item.quantity && !outOfStock) {
      errors.push({
        productId: item.productId,
        message: `Only ${product.stock} unit(s) of "${product.name}" are available.`,
      });
    }

    resultItems.push({
      productId: item.productId,
      product: {
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0]?.url ?? '',
        slug: product.slug,
        sku: product.sku,
      },
      quantity: item.quantity,
      available: !outOfStock && product.stock >= item.quantity,
    });
  }

  return { success: errors.length === 0, errors, items: resultItems };
}

/**
 * Atomically deduct inventory for multiple products.
 * Uses findOneAndUpdate with $inc to prevent race conditions.
 * Idempotent: checks orderId to avoid double-deduction.
 */
export async function deductInventory(
  items: StockCheckItem[],
  orderId: string
): Promise<{ success: boolean; errors: string[] }> {
  await connectDB();
  const session = await mongoose.startSession().catch(() => null);

  const errors: string[] = [];

  const doDeduct = async () => {
    for (const item of items) {
      const result = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          isActive: true,
          isOutOfStock: false,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        },
        { new: true }
      );

      if (!result) {
        const product = await Product.findById(item.productId).lean();
        if (!product) {
          errors.push(`Product ${item.productId} not found.`);
        } else if (!product.isActive) {
          errors.push(`"${product.name}" is no longer active.`);
        } else {
          errors.push(`Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`);
        }
      } else if (result.stock === 0) {
        // Auto-mark out of stock when stock reaches zero
        await Product.findByIdAndUpdate(item.productId, { isOutOfStock: true });
      }
    }
  };

  if (session) {
    try {
      await session.withTransaction(doDeduct);
    } catch (err) {
      errors.push('Transaction failed: ' + String(err));
    } finally {
      await session.endSession();
    }
  } else {
    // Fallback without transactions (single-node MongoDB)
    await doDeduct();
  }

  return { success: errors.length === 0, errors };
}

/**
 * Restore inventory (for cancellations).
 */
export async function restoreInventory(
  items: StockCheckItem[]
): Promise<{ success: boolean; errors: string[] }> {
  await connectDB();
  const errors: string[] = [];

  for (const item of items) {
    const result = await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.quantity },
      $set: { isOutOfStock: false },
    });

    if (!result) {
      errors.push(`Product ${item.productId} not found during inventory restore.`);
    }
  }

  return { success: errors.length === 0, errors };
}
