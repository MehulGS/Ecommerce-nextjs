/**
 * Reset Admin Password Script
 * Usage: npx tsx scripts/reset-admin-password.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
const EMAIL = process.env.ADMIN_SEED_EMAIL;
const PASSWORD = process.env.ADMIN_SEED_PASSWORD;

if (!MONGODB_URI || !EMAIL || !PASSWORD) {
  console.error('❌ MONGODB_URI, ADMIN_SEED_EMAIL, and ADMIN_SEED_PASSWORD must be set in .env');
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

  const existing = await Admin.findOne({ email: EMAIL });
  if (!existing) {
    console.error(`❌ No admin found with email: ${EMAIL}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(PASSWORD as string, salt);

  await Admin.updateOne({ email: EMAIL }, { $set: { password: hashedPassword } });

  console.log(`✅ Password reset successfully for: ${EMAIL}`);
  console.log(`   New password: ${PASSWORD}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
