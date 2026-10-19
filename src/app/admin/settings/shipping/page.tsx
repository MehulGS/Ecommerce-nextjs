import React from 'react';
import type { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import StoreSettings from '@/models/StoreSettings';
import ShippingSettingsForm from '@/components/admin/ShippingSettingsForm';

export const metadata: Metadata = {
  title: 'Shipping Settings — Admin',
  robots: { index: false },
};

async function getSettings() {
  try {
    await connectDB();
    const settings = await StoreSettings.findOne()
      .select('freeShippingThreshold standardShippingCharge expressShippingCharge estimatedDeliveryDays')
      .lean();
    return settings ? JSON.parse(JSON.stringify(settings)) : null;
  } catch { return null; }
}

export default async function ShippingSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-plum">Shipping Settings</h1>
        <p className="text-plum/50 text-sm">Configure delivery charges and timelines</p>
      </div>
      <ShippingSettingsForm initialSettings={settings} />
    </div>
  );
}
