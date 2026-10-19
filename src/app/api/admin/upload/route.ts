/**
 * POST /api/admin/upload
 *
 * Authenticated admin-only file upload endpoint.
 * Accepts multipart/form-data with:
 *   - file: the image file
 *   - category: 'products' | 'qr'
 *
 * Uploads to Vercel Blob (public store).
 * Returns: { url: string, pathname: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getAdminFromRequest } from '@/lib/auth';
import { randomBytes } from 'crypto';

type UploadCategory = 'products' | 'qr';

// Magic-byte validation — never trust client-supplied MIME type
function detectImageType(buffer: Buffer): { ext: string; mime: string } | null {
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return { ext: 'jpg', mime: 'image/jpeg' };
  // PNG
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return { ext: 'png', mime: 'image/png' };
  // WebP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return { ext: 'webp', mime: 'image/webp' };
  return null;
}

const MAX_BYTES: Record<UploadCategory, number> = {
  products: (Number(process.env.MAX_PRODUCT_IMAGE_SIZE_MB) || 5) * 1024 * 1024,
  qr: (Number(process.env.MAX_QR_IMAGE_SIZE_MB) || 3) * 1024 * 1024,
};

export async function POST(req: NextRequest) {
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
    const category: UploadCategory =
      typeof categoryRaw === 'string' && allowed.includes(categoryRaw as UploadCategory)
        ? (categoryRaw as UploadCategory)
        : 'products';

    // Size check
    if (file.size === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES[category]) {
      const limitMB = (MAX_BYTES[category] / 1024 / 1024).toFixed(0);
      return NextResponse.json(
        { error: `File too large. Maximum allowed size is ${limitMB} MB.` },
        { status: 413 }
      );
    }

    // Read and validate via magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const detected = detectImageType(buffer);

    if (!detected) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are accepted.' },
        { status: 415 }
      );
    }

    // Generate a unique filename
    const randomHex = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const prefix = category === 'products' ? 'prod' : 'qr';
    const filename = `${category}/${prefix}_${timestamp}_${randomHex}.${detected.ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: detected.mime,
      token: process.env.BLOB_IMAGE_READ_WRITE_TOKEN,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (err) {
    console.error('[admin/upload] Error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
