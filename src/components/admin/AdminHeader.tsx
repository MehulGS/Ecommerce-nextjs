'use client';

import React, { useEffect, useState } from 'react';
import { Bell, User } from 'lucide-react';

interface AdminInfo {
  name: string;
  email: string;
  role: string;
}

export default function AdminHeader() {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.admin) setAdmin(data.admin);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="bg-white border-b border-blush-100 px-6 py-4 flex items-center justify-between">
      <div className="lg:hidden" /> {/* Space for mobile menu button */}

      <div className="hidden lg:block">
        <p className="text-sm text-plum/50">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-blush-50 transition-colors">
          <Bell className="w-4.5 h-4.5 text-plum/60" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blush to-plum rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-ivory" />
          </div>
          {admin && (
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-plum leading-tight">{admin.name}</p>
              <p className="text-xs text-plum/50 capitalize">{admin.role}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
