/**
 * Demo Seed Script — Development Only
 *
 * Creates sample categories and products for local development/testing.
 * Run: npx tsx scripts/seed-demo.ts
 *
 * ⚠️  NEVER run on production!
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

const CategorySchema = new mongoose.Schema({
  name: String, slug: String, description: String,
  isActive: Boolean, sortOrder: Number,
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: String, slug: String, description: String, shortDescription: String,
  images: [{ url: String, alt: String, sortOrder: Number }],
  category: mongoose.Schema.Types.ObjectId,
  sku: String, price: Number, originalPrice: Number,
  stock: Number, isActive: Boolean, isOutOfStock: Boolean,
  isFeatured: Boolean, isBestseller: Boolean,
  tags: [String], specifications: [{ key: String, value: String }],
}, { timestamps: true });

const DEMO_PLACEHOLDER = 'https://placehold.co/400x400/f9b8cb/3d1c3c?text=Diva';

const categories = [
  { name: 'Korean Earrings', slug: 'korean-earrings', description: 'Trendy Korean-inspired earrings', isActive: true, sortOrder: 1 },
  { name: 'Cute Jewellery', slug: 'jewellery', description: 'Adorable jewellery pieces', isActive: true, sortOrder: 2 },
  { name: 'Scrunchies & Hair', slug: 'scrunchies', description: 'Scrunchies and hair accessories', isActive: true, sortOrder: 3 },
  { name: 'Accessories', slug: 'accessories', description: 'Cute accessories', isActive: true, sortOrder: 4 },
  { name: 'Gift Hampers', slug: 'gift-hampers', description: 'Thoughtfully curated gift hampers', isActive: true, sortOrder: 5 },
  { name: 'Premium Hampers', slug: 'premium-hampers', description: 'Premium luxury gift boxes', isActive: true, sortOrder: 6 },
  { name: 'Budget-Friendly', slug: 'budget-hampers', description: 'Beautiful gifts on a budget', isActive: true, sortOrder: 7 },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot run demo seed in production!');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Connected to MongoDB');

  const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);
  const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

  // Seed categories
  const catDocs: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of categories) {
    const existing = await CategoryModel.findOne({ slug: cat.slug });
    if (!existing) {
      const created = await CategoryModel.create(cat);
      catDocs[cat.slug] = created._id;
      console.log(`✅ Category: ${cat.name}`);
    } else {
      catDocs[cat.slug] = existing._id;
      console.log(`⏭️  Category already exists: ${cat.name}`);
    }
  }

  // Demo products
  const products = [
    {
      name: 'Starfish Korean Earrings',
      slug: 'starfish-korean-earrings',
      sku: 'CL-EAR-001',
      price: 299, originalPrice: 499,
      category: catDocs['korean-earrings'],
      description: 'Adorable starfish-shaped Korean earrings with gold detailing. Perfect for casual and festive looks.',
      shortDescription: 'Cute starfish Korean earrings in gold',
      images: [{ url: DEMO_PLACEHOLDER, alt: 'Starfish earrings', sortOrder: 0 }],
      stock: 50, isActive: true, isOutOfStock: false, isFeatured: true, isBestseller: false,
      tags: ['korean', 'earrings', 'gold', 'starfish'],
      specifications: [{ key: 'Material', value: 'Gold-plated brass' }, { key: 'Size', value: '1.5 cm' }],
    },
    {
      name: 'Pearl Drop Korean Earrings',
      slug: 'pearl-drop-korean-earrings',
      sku: 'CL-EAR-002',
      price: 349, originalPrice: 599,
      category: catDocs['korean-earrings'],
      description: 'Elegant pearl drop earrings with a Korean minimalist aesthetic. Versatile for all occasions.',
      shortDescription: 'Elegant pearl drop earrings',
      images: [{ url: DEMO_PLACEHOLDER, alt: 'Pearl earrings', sortOrder: 0 }],
      stock: 30, isActive: true, isOutOfStock: false, isFeatured: false, isBestseller: true,
      tags: ['korean', 'earrings', 'pearl', 'elegant'],
      specifications: [{ key: 'Material', value: 'Faux pearl, silver-plated' }],
    },
    {
      name: 'Floral Charm Bracelet',
      slug: 'floral-charm-bracelet',
      sku: 'CL-JEW-001',
      price: 399, originalPrice: 699,
      category: catDocs['jewellery'],
      description: 'Delicate floral charm bracelet with pastel enamel flowers. A sweet gift for someone special.',
      shortDescription: 'Pastel floral charm bracelet',
      images: [{ url: DEMO_PLACEHOLDER, alt: 'Floral bracelet', sortOrder: 0 }],
      stock: 25, isActive: true, isOutOfStock: false, isFeatured: true, isBestseller: true,
      tags: ['jewellery', 'bracelet', 'floral', 'gift'],
      specifications: [{ key: 'Material', value: 'Enamel, gold-plated' }],
    },
    {
      name: 'Pastel Scrunchie Set (5-pack)',
      slug: 'pastel-scrunchie-set-5pack',
      sku: 'CL-SCR-001',
      price: 249, originalPrice: 399,
      category: catDocs['scrunchies'],
      description: 'Set of 5 soft pastel scrunchies in assorted shades. Great for everyday use and gifting.',
      shortDescription: 'Set of 5 pastel scrunchies',
      images: [{ url: DEMO_PLACEHOLDER, alt: 'Scrunchie set', sortOrder: 0 }],
      stock: 100, isActive: true, isOutOfStock: false, isFeatured: false, isBestseller: true,
      tags: ['scrunchies', 'hair', 'pastel', 'set', 'gift'],
      specifications: [{ key: 'Count', value: '5 pieces' }, { key: 'Material', value: 'Soft satin' }],
    },
    {
      name: 'Birthday Bliss Gift Hamper',
      slug: 'birthday-bliss-gift-hamper',
      sku: 'CL-HAM-001',
      price: 799, originalPrice: 999,
      category: catDocs['gift-hampers'],
      description: 'A beautifully curated birthday gift hamper containing Korean earrings, scrunchies, and a personalised card. Perfect for your best friend.',
      shortDescription: 'Birthday gift hamper with earrings & scrunchies',
      images: [{ url: DEMO_PLACEHOLDER, alt: 'Birthday hamper', sortOrder: 0 }],
      stock: 20, isActive: true, isOutOfStock: false, isFeatured: true, isBestseller: false,
      tags: ['hamper', 'birthday', 'gift', 'friend'],
      specifications: [{ key: 'Includes', value: '1 pair earrings, 3 scrunchies, gift card' }],
    },
    {
      name: 'Premium Love Box',
      slug: 'premium-love-box',
      sku: 'CL-PRE-001',
      price: 1499, originalPrice: 1999,
      category: catDocs['premium-hampers'],
      description: 'A luxurious premium gift box for the one you love. Contains Korean earrings, jewellery, scrunchies, a candle, and handwritten card in a beautiful box.',
      shortDescription: 'Premium gift box for her',
      images: [{ url: DEMO_PLACEHOLDER, alt: 'Premium love box', sortOrder: 0 }],
      stock: 10, isActive: true, isOutOfStock: false, isFeatured: true, isBestseller: false,
      tags: ['premium', 'hamper', 'romantic', 'birthday', 'luxury'],
      specifications: [{ key: 'Includes', value: 'Earrings + Bracelet + 5 Scrunchies + Candle + Card' }],
    },
    {
      name: 'Mini Friendship Gift Box',
      slug: 'mini-friendship-gift-box',
      sku: 'CL-BUD-001',
      price: 399, originalPrice: 599,
      category: catDocs['budget-hampers'],
      description: 'A sweet mini gift box perfect for friendship gifting on a budget. Contains cute accessories and a personalised note.',
      shortDescription: 'Budget-friendly friendship gift',
      images: [{ url: DEMO_PLACEHOLDER, alt: 'Friendship gift box', sortOrder: 0 }],
      stock: 40, isActive: true, isOutOfStock: false, isFeatured: false, isBestseller: true,
      tags: ['budget', 'friendship', 'gift', 'mini'],
      specifications: [{ key: 'Includes', value: '1 pair earrings, 2 scrunchies, card' }],
    },
  ];

  for (const product of products) {
    const existing = await ProductModel.findOne({ slug: product.slug });
    if (!existing) {
      await ProductModel.create(product);
      console.log(`✅ Product: ${product.name}`);
    } else {
      console.log(`⏭️  Product already exists: ${product.name}`);
    }
  }

  console.log('\n🎉 Demo seed complete!');
  console.log('📦 7 demo products and 7 categories created');
  console.log('🌐 Visit http://localhost:3000 to see your store\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
