/**
 * DELETE /api/admin/upload/delete
 *
 * Authenticated admin-only file deletion.
 * Body: { url: string, category: 'products' | 'qr' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { deleteUploadedFile, type UploadCategory } from '@/lib/upload';

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url, category } = await req.json() as { url: string; category: UploadCategory };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    const allowed: UploadCategory[] = ['products', 'qr'];
    if (!allowed.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    deleteUploadedFile(url, category);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/upload/delete] Error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
