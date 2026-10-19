import React from 'react';
import type { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Customers — Admin',
  robots: { index: false },
};

async function getCustomers() {
  try {
    await connectDB();
    const customers = await Order.aggregate([
      {
        $group: {
          _id: '$customer.email',
          fullName: { $last: '$customer.fullName' },
          phone: { $last: '$customer.phone' },
          email: { $last: '$customer.email' },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } },
          lastOrder: { $max: '$createdAt' },
        },
      },
      { $sort: { lastOrder: -1 } },
      { $limit: 100 },
    ]);
    return JSON.parse(JSON.stringify(customers));
  } catch { return []; }
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-plum">Customers</h1>
        <p className="text-plum/50 text-sm">{customers.length} unique customers</p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-blush-50 overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-8 text-center text-plum/40">No customers yet. Your first order will appear here!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blush-50 text-plum/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Phone</th>
                  <th className="text-left px-5 py-3">Orders</th>
                  <th className="text-left px-5 py-3">Total Spent</th>
                  <th className="text-left px-5 py-3">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-50">
                {customers.map((c: {
                  _id: string;
                  fullName: string;
                  email: string;
                  phone: string;
                  totalOrders: number;
                  totalSpent: number;
                  lastOrder: string;
                }) => (
                  <tr key={c._id} className="hover:bg-blush-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-plum">{c.fullName}</p>
                      <p className="text-xs text-plum/40">{c.email}</p>
                    </td>
                    <td className="px-5 py-3 text-plum/60">{c.phone}</td>
                    <td className="px-5 py-3 font-medium text-plum">{c.totalOrders}</td>
                    <td className="px-5 py-3 font-semibold text-plum">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-5 py-3 text-plum/50 text-xs">
                      {new Date(c.lastOrder).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
