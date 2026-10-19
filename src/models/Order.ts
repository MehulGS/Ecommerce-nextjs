import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  productSnapshot: {
    name: string;
    slug: string;
    sku: string;
    image: string;
    price: number;
    originalPrice?: number;
  };
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  instagramUsername?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export type PaymentStatus =
  | 'pending'
  | 'verification_required'
  | 'paid'
  | 'failed'
  | 'rejected'
  | 'refund_pending'
  | 'refunded';

export type FulfilmentStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface IOrder extends Document {
  orderNumber: string;
  customer: IShippingAddress;
  items: IOrderItem[];
  subtotal: number;
  productDiscount: number;
  shippingCharge: number;
  couponDiscount: number;
  total: number;
  paymentMethod: 'static_qr';
  paymentStatus: PaymentStatus;
  fulfilmentStatus: FulfilmentStatus;
  paymentReference?: string;
  qrPaymentProofUrl?: string;
  qrPaymentProofPublicId?: string;
  notes?: string;
  couponCode?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  adminNotes?: string;
  refundReference?: string;
  idempotencyKey: string;
  inventoryDeducted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productSnapshot: {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
  },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
});

const ShippingAddressSchema = new Schema<IShippingAddress>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  instagramUsername: { type: String },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: ShippingAddressSchema, required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    productDiscount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['static_qr'],
      required: true,
      default: 'static_qr',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'verification_required', 'paid', 'failed', 'rejected', 'refund_pending', 'refunded'],
      default: 'pending',
    },
    fulfilmentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentReference: { type: String },
    qrPaymentProofUrl: { type: String },
    qrPaymentProofPublicId: { type: String },
    notes: { type: String },
    couponCode: { type: String },
    shippingCarrier: { type: String },
    trackingNumber: { type: String },
    adminNotes: { type: String },
    refundReference: { type: String },
    idempotencyKey: { type: String, required: true, unique: true },
    inventoryDeducted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ fulfilmentStatus: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
