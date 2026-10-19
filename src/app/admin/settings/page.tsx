import React from 'react';
import type { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import StoreSettings from '@/models/StoreSettings';
import StoreSettingsForm from '@/components/admin/StoreSettingsForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Store Settings — Admin',
  robots: { index: false },
};

async function getSettings() {
  try {
    await connectDB();
    let settings = await StoreSettings.findOne().lean();
    if (!settings) {
      // Create defaults
      const created = await StoreSettings.create({});
      settings = created.toObject();
    }
    return JSON.parse(JSON.stringify(settings));
  } catch { return null; }
}

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-plum">Store Settings</h1>
        <p className="text-plum/50 text-sm">Manage your store information and preferences</p>
      </div>
      <StoreSettingsForm initialSettings={settings} />
    </div>
  );
}
