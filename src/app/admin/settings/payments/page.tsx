import React from 'react';
import type { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import StoreSettings from '@/models/StoreSettings';
import PaymentSettingsForm from '@/components/admin/PaymentSettingsForm';

export const metadata: Metadata = {
  title: 'Payment Settings — Admin',
  robots: { index: false },
};

async function getSettings() {
  try {
    await connectDB();
    const settings = await StoreSettings.findOne()
      .select('staticQrImageUrl upiId paymentInstructions')
      .lean();
    return settings ? JSON.parse(JSON.stringify(settings)) : null;
  } catch { return null; }
}

export default async function PaymentSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-plum">Payment Settings</h1>
        <p className="text-plum/50 text-sm">Configure your UPI QR code and payment instructions</p>
      </div>
      <PaymentSettingsForm initialSettings={settings} />
    </div>
  );
}
