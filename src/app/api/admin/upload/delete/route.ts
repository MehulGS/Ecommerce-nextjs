/**
 * DELETE /api/admin/upload/delete
 *
 * Authenticated admin-only image deletion from Vercel Blob.
 * Body: { url: string }  — the full Vercel Blob URL to delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { getAdminFromRequest } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as { url?: string };
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    // Only delete Vercel Blob URLs — skip legacy local /uploads/... paths
    if (url.startsWith('https://')) {
      await del(url, { token: process.env.BLOB_IMAGE_READ_WRITE_TOKEN });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/upload/delete] Error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
