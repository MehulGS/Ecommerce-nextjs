/**
 * POST /api/admin/upload
 *
 * Authenticated admin-only file upload endpoint.
 * Accepts multipart/form-data with:
 *   - file: the image file
 *   - category: 'products' | 'qr'   (payment-proofs uses its own endpoint)
 *
 * Returns: { url: string, filename: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { saveUploadedFile, type UploadCategory } from '@/lib/upload';

export async function POST(req: NextRequest) {
  // Auth check
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const categoryRaw = formData.get('category');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowed: UploadCategory[] = ['products', 'qr'];
    const category = (
      typeof categoryRaw === 'string' && allowed.includes(categoryRaw as UploadCategory)
        ? categoryRaw
        : 'products'
    ) as UploadCategory;

    const result = await saveUploadedFile(file, { category });

    if (!result.ok) {
      const status =
        result.error.code === 'INVALID_TYPE'
          ? 415
          : result.error.code === 'TOO_LARGE'
          ? 413
          : 500;
      return NextResponse.json({ error: result.error.message }, { status });
    }

    return NextResponse.json({
      url: result.value.publicUrl!,
      filename: result.value.filename,
    });
  } catch (err) {
    console.error('[admin/upload] Error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
