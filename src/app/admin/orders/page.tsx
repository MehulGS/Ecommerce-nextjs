import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Orders — Admin',
  robots: { index: false },
};

interface SearchParams {
  page?: string;
  search?: string;
  paymentStatus?: string;
  fulfilmentStatus?: string;
}

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  verification_required: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  refund_pending: 'bg-orange-100 text-orange-700',
  refunded: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

async function getOrders(searchParams: SearchParams) {
  try {
    await connectDB();
        const query: any = {};

    if (searchParams.search) {
      query.$or = [
        { orderNumber: { $regex: searchParams.search, $options: 'i' } },
        { 'customer.email': { $regex: searchParams.search, $options: 'i' } },
        { 'customer.phone': { $regex: searchParams.search, $options: 'i' } },
        { 'customer.fullName': { $regex: searchParams.search, $options: 'i' } },
      ];
    }
    if (searchParams.paymentStatus) query.paymentStatus = searchParams.paymentStatus;
    if (searchParams.fulfilmentStatus) query.fulfilmentStatus = searchParams.fulfilmentStatus;

    const page = Math.max(1, Number(searchParams.page ?? 1));
    const skip = (page - 1) * PAGE_SIZE;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).lean(),
      Order.countDocuments(query),
    ]);

    return {
      orders: JSON.parse(JSON.stringify(orders)),
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  } catch {
    return { orders: [], total: 0, page: 1, totalPages: 0 };
  }
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { orders, total, page, totalPages } = await getOrders(searchParams);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-plum">Orders</h1>
        <p className="text-plum/50 text-sm">{total} total orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush-50">
        <form className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-plum/40" />
            <input
              name="search"
              type="search"
              defaultValue={searchParams.search}
              placeholder="Search order, customer, phone..."
              className="input-field pl-10 py-2"
            />
          </div>
          <select name="paymentStatus" defaultValue={searchParams.paymentStatus ?? ''} className="input-field py-2 w-auto">
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="verification_required">Awaiting Verification</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
          </select>
          <select name="fulfilmentStatus" defaultValue={searchParams.fulfilmentStatus ?? ''} className="input-field py-2 w-auto">
            <option value="">All Fulfilment Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" className="btn-primary py-2 px-5">Filter</button>
          <Link href="/admin/orders" className="btn-secondary py-2 px-5">Clear</Link>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-blush-50 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-plum/40">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blush-50 text-plum/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Order</th>
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Total</th>
                  <th className="text-left px-5 py-3">Payment</th>
                  <th className="text-left px-5 py-3">Fulfilment</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-50">
                {orders.map((order: {
                  _id: string;
                  orderNumber: string;
                  customer: { fullName: string; email: string; phone: string };
                  total: number;
                  paymentMethod: string;
                  paymentStatus: string;
                  fulfilmentStatus: string;
                  createdAt: string;
                }) => (
                  <tr key={order._id} className="hover:bg-blush-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${order._id}`} className="font-mono text-sm font-medium text-plum hover:text-blush-600">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-plum">{order.customer.fullName}</p>
                      <p className="text-xs text-plum/40">{order.customer.phone}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-plum">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3">
                      <div className="space-y-1">
                        <span className={`badge text-xs ${statusColors[order.paymentStatus] ?? ''}`}>
                          {order.paymentStatus.replace(/_/g, ' ')}
                        </span>
                        <p className="text-xs text-plum/40 capitalize">{order.paymentMethod.replace(/_/g, ' ')}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge text-xs ${statusColors[order.fulfilmentStatus] ?? ''}`}>
                        {order.fulfilmentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-plum/50 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${order._id}`} className="text-sm text-blush-500 hover:text-blush-600 font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center py-4 gap-2 border-t border-blush-50">
            {Array.from({ length: totalPages }).map((_, i) => (
              <a
                key={i}
                href={`?${new URLSearchParams({ ...searchParams, page: String(i + 1) })}`}
                className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  page === i + 1 ? 'bg-plum text-ivory' : 'hover:bg-blush-50 text-plum'
                }`}
              >
                {i + 1}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

