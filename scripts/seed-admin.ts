/**
 * Admin Seed Script
 * 
 * Run ONCE to create the initial admin account.
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *
 * Environment variables required in .env.local:
 *   MONGODB_URI, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, ADMIN_SEED_NAME
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
const EMAIL = process.env.ADMIN_SEED_EMAIL;
const PASSWORD = process.env.ADMIN_SEED_PASSWORD;
const NAME = process.env.ADMIN_SEED_NAME ?? 'Store Admin';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env.local');
  process.exit(1);
}
if (!EMAIL || !PASSWORD) {
  console.error('❌ ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env.local');
  process.exit(1);
}

const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, default: 'superadmin' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI as string);
  console.log('✅ Connected');

  const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

  // Check if admin already exists
  const existing = await Admin.findOne({ email: EMAIL });
  if (existing) {
    console.log(`⚠️  Admin with email ${EMAIL} already exists. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(PASSWORD as string, salt);

  await Admin.create({
    name: NAME,
    email: EMAIL,
    password: hashedPassword,
    role: 'superadmin',
    isActive: true,
  });

  console.log(`✅ Admin created successfully!`);
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Role: superadmin`);
  console.log(`\n🔑 Login at: http://localhost:3000/admin/login`);
  console.log(`\n⚠️  IMPORTANT: Change the password after first login!`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
