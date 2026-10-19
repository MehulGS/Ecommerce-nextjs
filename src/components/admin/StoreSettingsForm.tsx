'use client';

import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Settings {
  storeName: string;
  tagline?: string;
  email: string;
  phone: string;
  address?: string;
  instagramUrl?: string;
  instagramUsername?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  announcement?: string;
  announcementActive: boolean;
  returnPolicy: string;
  shippingPolicy?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export default function StoreSettingsForm({ initialSettings }: { initialSettings: Settings | null }) {
  const [form, setForm] = useState<Settings>({
    storeName: initialSettings?.storeName ?? 'Craftlove01',
    tagline: initialSettings?.tagline ?? '',
    email: initialSettings?.email ?? '',
    phone: initialSettings?.phone ?? '',
    address: initialSettings?.address ?? '',
    instagramUrl: initialSettings?.instagramUrl ?? '',
    instagramUsername: initialSettings?.instagramUsername ?? '',
    facebookUrl: initialSettings?.facebookUrl ?? '',
    whatsappNumber: initialSettings?.whatsappNumber ?? '',
    announcement: initialSettings?.announcement ?? '',
    announcementActive: initialSettings?.announcementActive ?? false,
    returnPolicy: initialSettings?.returnPolicy ?? '',
    shippingPolicy: initialSettings?.shippingPolicy ?? '',
    metaTitle: initialSettings?.metaTitle ?? '',
    metaDescription: initialSettings?.metaDescription ?? '',
  });
  const [loading, setLoading] = useState(false);

  const update = (field: keyof Settings, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Settings saved!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Store Info */}
      <div className="bg-white rounded-2xl p-6 shadow-soft space-y-5">
        <h2 className="font-semibold text-plum">Store Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Store Name</label>
            <input type="text" value={form.storeName} onChange={(e) => update('storeName', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input type="text" value={form.tagline} onChange={(e) => update('tagline', e.target.value)} className="input-field" placeholder="Gifts with love, crafted with care" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" />
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} className="input-field" />
        </div>
      </div>

      {/* Social */}
      <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
        <h2 className="font-semibold text-plum">Social Media</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Instagram URL</label>
            <input type="url" value={form.instagramUrl} onChange={(e) => update('instagramUrl', e.target.value)} className="input-field" placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className="label">Instagram Username</label>
            <input type="text" value={form.instagramUsername} onChange={(e) => update('instagramUsername', e.target.value)} className="input-field" placeholder="@craftlove01" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Facebook URL</label>
            <input type="url" value={form.facebookUrl} onChange={(e) => update('facebookUrl', e.target.value)} className="input-field" placeholder="https://facebook.com/..." />
          </div>
          <div>
            <label className="label">WhatsApp Number</label>
            <input type="text" value={form.whatsappNumber} onChange={(e) => update('whatsappNumber', e.target.value)} className="input-field" placeholder="+91 99999 99999" />
          </div>
        </div>
      </div>

      {/* Announcement */}
      <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-plum">Announcement Bar</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-plum/60">Active</span>
            <div
              onClick={() => update('announcementActive', !form.announcementActive)}
              className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${form.announcementActive ? 'bg-plum' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.announcementActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>
        <input
          type="text"
          value={form.announcement}
          onChange={(e) => update('announcement', e.target.value)}
          className="input-field"
          placeholder="✨ Free shipping on orders above ₹999"
        />
      </div>

      {/* Policies */}
      <div className="bg-white rounded-2xl p-6 shadow-soft space-y-5">
        <h2 className="font-semibold text-plum">Policies</h2>
        <div>
          <label className="label">Return Policy</label>
          <textarea value={form.returnPolicy} onChange={(e) => update('returnPolicy', e.target.value)} className="input-field h-28 resize-none" />
        </div>
        <div>
          <label className="label">Shipping Policy</label>
          <textarea value={form.shippingPolicy} onChange={(e) => update('shippingPolicy', e.target.value)} className="input-field h-28 resize-none" />
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
        <h2 className="font-semibold text-plum">SEO</h2>
        <div>
          <label className="label">Meta Title</label>
          <input type="text" value={form.metaTitle} onChange={(e) => update('metaTitle', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label">Meta Description</label>
          <textarea value={form.metaDescription} onChange={(e) => update('metaDescription', e.target.value)} className="input-field h-20 resize-none" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-4">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Settings</>}
      </button>
    </form>
  );
}
