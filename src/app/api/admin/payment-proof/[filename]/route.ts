/**
 * GET /api/admin/payment-proof/[filename]
 *
 * Authenticated admin-only endpoint to view payment proof images.
 * Proof files are stored outside the public/ directory and are
 * only accessible through this route after JWT verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAdminFromRequest } from '@/lib/auth';
import { getUploadDir } from '@/lib/upload';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { filename } = params;

  // Sanitise: filename must not contain path separators or traversal sequences
  if (
    !filename ||
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('..')
  ) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  // Only allow generated proof filenames (must start with 'proof_')
  if (!filename.startsWith('proof_')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const dir = getUploadDir('payment-proofs');
  const absolutePath = path.join(dir, filename);

  // Guard: path must stay within the proofs directory
  const normalised = path.normalize(absolutePath);
  const allowedDir = path.normalize(dir);
  if (!normalised.startsWith(allowedDir + path.sep) && normalised !== allowedDir) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!fs.existsSync(normalised)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const buffer = fs.readFileSync(normalised);

  // Detect content type from extension
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const contentType = mimeTypes[ext] ?? 'application/octet-stream';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      // Prevent caching — proof images are sensitive
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
