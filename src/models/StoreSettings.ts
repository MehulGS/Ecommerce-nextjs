import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStoreSettings extends Document {
  storeName: string;
  tagline?: string;
  logoUrl?: string;
  logoPublicId?: string;
  email: string;
  phone: string;
  address?: string;
  instagramUrl?: string;
  instagramUsername?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  whatsappNumber?: string;
  announcement?: string;
  announcementActive: boolean;
  returnPolicy: string;
  shippingPolicy?: string;
  privacyPolicy?: string;
  termsConditions?: string;
  freeShippingThreshold: number;
  standardShippingCharge: number;
  expressShippingCharge: number;
  estimatedDeliveryDays: string;
  paymentMode: 'static_qr';
  staticQrImageUrl?: string;
  upiId?: string;
  paymentInstructions?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName: { type: String, default: 'Craftlove01' },
    tagline: { type: String, default: 'Gifts with love, crafted with care' },
    logoUrl: { type: String },
    logoPublicId: { type: String },
    email: { type: String, default: 'hello@craftlove01.com' },
    phone: { type: String, default: '+91 9999999999' },
    address: { type: String },
    instagramUrl: { type: String },
    instagramUsername: { type: String },
    facebookUrl: { type: String },
    twitterUrl: { type: String },
    whatsappNumber: { type: String },
    announcement: { type: String },
    announcementActive: { type: Boolean, default: false },
    returnPolicy: { type: String, default: 'Returns accepted within 7 days for damaged or incorrect items.' },
    shippingPolicy: { type: String },
    privacyPolicy: { type: String },
    termsConditions: { type: String },
    freeShippingThreshold: { type: Number, default: 999 },
    standardShippingCharge: { type: Number, default: 79 },
    expressShippingCharge: { type: Number, default: 149 },
    estimatedDeliveryDays: { type: String, default: '5-7 business days' },
    paymentMode: { type: String, enum: ['static_qr'], default: 'static_qr' },
    staticQrImageUrl: { type: String },
    upiId: { type: String },
    paymentInstructions: { type: String, default: 'Scan the QR code to pay via UPI. Upload your payment screenshot after payment.' },
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  { timestamps: true }
);

const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema);

export default StoreSettings;
