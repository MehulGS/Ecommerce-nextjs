import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductImage {
  url: string;
  publicId?: string;
  alt?: string;
  sortOrder: number;
}

export interface IProductSpec {
  key: string;
  value: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: IProductImage[];
  category: mongoose.Types.ObjectId;
  sku: string;
  price: number;
  originalPrice?: number;
  stock: number;
  isActive: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  tags: string[];
  specifications: IProductSpec[];
  weight?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  publicId: { type: String },
  alt: { type: String },
  sortOrder: { type: Number, default: 0 },
});

const ProductSpecSchema = new Schema<IProductSpec>({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    images: { type: [ProductImageSchema], default: [] },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    isOutOfStock: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    specifications: { type: [ProductSpecSchema], default: [] },
    weight: { type: Number },
  },
  { timestamps: true }
);

ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ isActive: 1, isBestseller: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
