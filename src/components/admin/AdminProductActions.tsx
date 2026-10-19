'use client';

import React, { useState } from 'react';
import { MoreHorizontal, Power, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Props {
  productId: string;
  isActive: boolean;
}

export default function AdminProductActions({ productId, isActive }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        toast.success(isActive ? 'Product deactivated' : 'Product activated');
        router.refresh();
      } else {
        toast.error('Failed to update product');
      }
    } catch {
      toast.error('Error updating product');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blush-50 text-plum/60 hover:text-plum transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-hover border border-blush-100 py-1 z-20 w-44">
            <button
              onClick={handleToggleActive}
              disabled={loading}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-blush-50 transition-colors text-plum"
            >
              <Power className="w-4 h-4" />
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
