import React from 'react';
import type { Metadata } from 'next';
import {
  ShoppingBag, Package, TrendingUp, Clock, CheckCircle,
  Truck, AlertCircle, XCircle, QrCode,
} from 'lucide-react';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Dashboard — Admin',
  robots: { index: false },
};

export const revalidate = 60;

async function getDashboardStats() {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingPayment,
      verificationRequired,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      revenue,
      activeProducts,
      inactiveProducts,
      lowStock,
      outOfStock,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ paymentStatus: 'pending' }),
      Order.countDocuments({ paymentStatus: 'verification_required' }),
      Order.countDocuments({ fulfilmentStatus: 'confirmed' }),
      Order.countDocuments({ fulfilmentStatus: 'processing' }),
      Order.countDocuments({ fulfilmentStatus: 'shipped' }),
      Order.countDocuments({ fulfilmentStatus: 'delivered' }),
      Order.countDocuments({ fulfilmentStatus: 'cancelled' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 5 } }),
      Product.countDocuments({ $or: [{ isOutOfStock: true }, { stock: 0 }] }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      totalOrders,
      todayOrders,
      pendingPayment,
      verificationRequired,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      revenue: revenue[0]?.total ?? 0,
      activeProducts,
      inactiveProducts,
      lowStock,
      outOfStock,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
    };
  } catch {
    return null;
  }
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  verification_required: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-plum/50">Failed to load dashboard statistics</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.revenue),
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      href: '/admin/orders?paymentStatus=paid',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      color: 'bg-blush-50 text-blush-600',
      href: '/admin/orders',
      sub: `${stats.todayOrders} today`,
    },
    {
      label: 'Pending Payment',
      value: stats.pendingPayment.toString(),
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600',
      href: '/admin/orders?paymentStatus=pending',
    },
    {
      label: 'Awaiting Verification',
      value: stats.verificationRequired.toString(),
      icon: QrCode,
      color: 'bg-amber-50 text-amber-600',
      href: '/admin/orders?paymentStatus=verification_required',
    },
  ];

  const orderStats = [
    { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle, color: 'text-blue-500' },
    { label: 'Processing', value: stats.processing, icon: Package, color: 'text-purple-500' },
    { label: 'Shipped', value: stats.shipped, icon: Truck, color: 'text-indigo-500' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-red-500' },
  ];

  const productStats = [
    { label: 'Active Products', value: stats.activeProducts, color: 'text-green-600', href: '/admin/products?status=active' },
    { label: 'Inactive Products', value: stats.inactiveProducts, color: 'text-gray-400', href: '/admin/products?status=inactive' },
    { label: 'Low Stock (≤5)', value: stats.lowStock, color: 'text-amber-600', href: '/admin/products?stock=low' },
    { label: 'Out of Stock', value: stats.outOfStock, color: 'text-red-500', href: '/admin/products?stock=out' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-plum">Dashboard</h1>
        <p className="text-plum/50 text-sm mt-0.5">Your store at a glance</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-card transition-all duration-200 border border-blush-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-plum/50 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-plum">{card.value}</p>
                  {card.sub && <p className="text-xs text-plum/40 mt-1">{card.sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Statuses */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-blush-50">
          <h2 className="font-serif text-lg font-semibold text-plum mb-4">Order Status</h2>
          <div className="space-y-3">
            {orderStats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-sm text-plum/70">{s.label}</span>
                  </div>
                  <span className="font-semibold text-plum">{s.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-blush-50">
          <h2 className="font-serif text-lg font-semibold text-plum mb-4">Products</h2>
          <div className="space-y-3">
            {productStats.map((s) => (
              <Link key={s.label} href={s.href} className="flex items-center justify-between hover:bg-blush-50 rounded-lg px-2 py-1 -mx-2 transition-colors">
                <span className="text-sm text-plum/70">{s.label}</span>
                <span className={`font-bold text-lg ${s.color}`}>{s.value}</span>
              </Link>
            ))}
          </div>
          <Link href="/admin/products/new" className="btn-primary w-full mt-4 text-sm py-2.5">
            + Add Product
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-blush-50">
          <h2 className="font-serif text-lg font-semibold text-plum mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: '+ Add New Product', href: '/admin/products/new' },
              { label: '📋 Verify QR Payments', href: '/admin/orders?paymentStatus=verification_required' },
              { label: '🚚 Update Shipping', href: '/admin/orders?fulfilmentStatus=confirmed' },
              { label: '⚙️ Store Settings', href: '/admin/settings' },
              { label: '💳 Payment Settings', href: '/admin/settings/payments' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block w-full text-left text-sm px-4 py-2.5 rounded-xl border border-blush-100 hover:bg-blush-50 hover:border-blush-300 transition-colors text-plum font-medium"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-soft border border-blush-50 overflow-hidden">
        <div className="px-5 py-4 border-b border-blush-100 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-plum">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-blush-500 hover:text-blush-600 font-medium">
            View all →
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="px-5 py-8 text-center text-plum/40 text-sm">
            No orders yet. Share your store to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blush-50 text-plum/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Order</th>
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Total</th>
                  <th className="text-left px-5 py-3">Payment</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-50">
                {stats.recentOrders.map((order: {
                  _id: string;
                  orderNumber: string;
                  customer: { fullName: string; email: string };
                  total: number;
                  paymentStatus: string;
                  fulfilmentStatus: string;
                  createdAt: string;
                }) => (
                  <tr key={order._id} className="hover:bg-blush-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="font-medium text-plum hover:text-blush-600"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-plum">{order.customer.fullName}</p>
                      <p className="text-plum/40 text-xs">{order.customer.email}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-plum">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge text-xs ${statusColor[order.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge text-xs ${statusColor[order.fulfilmentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.fulfilmentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-plum/50 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
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
