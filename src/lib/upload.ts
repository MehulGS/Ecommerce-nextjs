/**
 * Server-side file upload utility.
 * Validates, sanitises, and persists uploaded images to the local filesystem.
 * Never trusts client-supplied filenames or MIME types.
 */

import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// Configuration — all tuneable via environment variables
// ---------------------------------------------------------------------------

const ROOT_DIR = process.cwd(); // Next.js project root

function getUploadBase(): string {
  return process.env.UPLOAD_DIR
    ? path.resolve(ROOT_DIR, process.env.UPLOAD_DIR)
    : path.join(ROOT_DIR, 'public', 'uploads');
}

function getMaxSizeMB(envVar: string, defaultMB: number): number {
  const val = process.env[envVar];
  const parsed = val ? parseFloat(val) : NaN;
  return isNaN(parsed) ? defaultMB : parsed;
}

export type UploadCategory = 'products' | 'qr' | 'payment-proofs';

/**
 * Returns the absolute filesystem directory for a given upload category.
 * Payment proofs are stored OUTSIDE the public/ tree so they cannot be
 * fetched by guessing a URL — they are served through an authenticated
 * Route Handler instead.
 */
export function getUploadDir(category: UploadCategory): string {
  if (category === 'payment-proofs') {
    // Private — not under public/
    const privateDir = process.env.PRIVATE_UPLOAD_DIR
      ? path.resolve(ROOT_DIR, process.env.PRIVATE_UPLOAD_DIR)
      : path.join(ROOT_DIR, 'uploads', 'payment-proofs');
    return privateDir;
  }
  return path.join(getUploadBase(), category);
}

/**
 * Returns the public URL path for a given absolute filesystem path.
 * Only valid for files under the public/ tree (products, qr).
 */
export function filePathToUrl(absolutePath: string): string {
  const publicDir = path.join(ROOT_DIR, 'public');
  const relative = path.relative(publicDir, absolutePath);
  // Replace Windows backslashes with forward slashes
  return '/' + relative.replace(/\\/g, '/');
}

// ---------------------------------------------------------------------------
// Magic-byte / file-signature validation
// ---------------------------------------------------------------------------

const MAGIC_BYTES: Array<{ type: string; ext: string; match: (buf: Buffer) => boolean }> = [
  {
    type: 'image/jpeg',
    ext: '.jpg',
    match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    type: 'image/png',
    ext: '.png',
    match: (b) =>
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    type: 'image/webp',
    ext: '.webp',
    match: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
];

function detectImageType(buffer: Buffer): { type: string; ext: string } | null {
  for (const sig of MAGIC_BYTES) {
    if (sig.match(buffer)) {
      return { type: sig.type, ext: sig.ext };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UploadOptions {
  category: UploadCategory;
  /** Override the size limit (bytes). Defaults to category-based env vars. */
  maxBytes?: number;
}

export interface UploadResult {
  /** Absolute filesystem path */
  filePath: string;
  /**
   * Public URL path (only set for publicly-served categories like products/qr).
   * Undefined for payment-proofs — access via authenticated API route.
   */
  publicUrl?: string;
  /** Detected MIME type */
  mimeType: string;
  /** Generated filename (no path) */
  filename: string;
}

export interface UploadError {
  code: 'INVALID_TYPE' | 'TOO_LARGE' | 'WRITE_ERROR' | 'EMPTY_FILE';
  message: string;
}

/**
 * Save a Web API `File` (from `formData.get('field') as File`) to disk.
 *
 * Validates:
 *   - File is not empty
 *   - File magic bytes match an allowed image format
 *   - File size is within the configured limit
 *
 * Generates a cryptographically random filename — the original name is
 * never used on the filesystem.
 *
 * Returns either { ok: true, value: UploadResult } or { ok: false, error: UploadError }.
 */
export async function saveUploadedFile(
  file: File,
  opts: UploadOptions
): Promise<{ ok: true; value: UploadResult } | { ok: false; error: UploadError }> {
  // ------------------------------------------------------------------
  // 1. Determine max size
  // ------------------------------------------------------------------
  let maxBytes: number;
  if (opts.maxBytes !== undefined) {
    maxBytes = opts.maxBytes;
  } else {
    const MB = (() => {
      switch (opts.category) {
        case 'products':
          return getMaxSizeMB('MAX_PRODUCT_IMAGE_SIZE_MB', 5);
        case 'qr':
          return getMaxSizeMB('MAX_QR_IMAGE_SIZE_MB', 3);
        case 'payment-proofs':
          return getMaxSizeMB('MAX_PAYMENT_PROOF_SIZE_MB', 5);
      }
    })();
    maxBytes = MB * 1024 * 1024;
  }

  // ------------------------------------------------------------------
  // 2. Read bytes
  // ------------------------------------------------------------------
  if (file.size === 0) {
    return { ok: false, error: { code: 'EMPTY_FILE', message: 'Uploaded file is empty.' } };
  }

  if (file.size > maxBytes) {
    const limitMB = (maxBytes / 1024 / 1024).toFixed(0);
    return {
      ok: false,
      error: {
        code: 'TOO_LARGE',
        message: `File too large. Maximum allowed size is ${limitMB} MB.`,
      },
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // ------------------------------------------------------------------
  // 3. Validate via magic bytes (ignore client-supplied MIME / filename)
  // ------------------------------------------------------------------
  const detected = detectImageType(buffer);
  if (!detected) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TYPE',
        message: 'Invalid file type. Only JPEG, PNG, and WebP images are accepted.',
      },
    };
  }

  // ------------------------------------------------------------------
  // 4. Generate a safe, unique filename
  // ------------------------------------------------------------------
  const randomHex = randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const prefix =
    opts.category === 'products'
      ? 'prod'
      : opts.category === 'qr'
      ? 'qr'
      : 'proof';
  const filename = `${prefix}_${timestamp}_${randomHex}${detected.ext}`;

  // ------------------------------------------------------------------
  // 5. Ensure directory exists
  // ------------------------------------------------------------------
  const dir = getUploadDir(opts.category);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    return {
      ok: false,
      error: { code: 'WRITE_ERROR', message: `Cannot create upload directory: ${String(err)}` },
    };
  }

  // Path-traversal guard: filename must not contain path separators
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return {
      ok: false,
      error: { code: 'WRITE_ERROR', message: 'Generated filename contains illegal characters.' },
    };
  }

  const absolutePath = path.join(dir, filename);

  // ------------------------------------------------------------------
  // 6. Write to disk
  // ------------------------------------------------------------------
  try {
    fs.writeFileSync(absolutePath, buffer);
  } catch (err) {
    return {
      ok: false,
      error: { code: 'WRITE_ERROR', message: `Failed to write file: ${String(err)}` },
    };
  }

  // ------------------------------------------------------------------
  // 7. Build result
  // ------------------------------------------------------------------
  const publicUrl =
    opts.category !== 'payment-proofs' ? filePathToUrl(absolutePath) : undefined;

  return {
    ok: true,
    value: {
      filePath: absolutePath,
      publicUrl,
      mimeType: detected.type,
      filename,
    },
  };
}

/**
 * Safely delete an uploaded file.
 * Accepts a relative public URL (/uploads/products/...) or an absolute path.
 * Prevents path-traversal attacks by normalising and confirming the path
 * stays within the expected upload directories.
 */
export function deleteUploadedFile(
  filePathOrUrl: string,
  category: UploadCategory
): void {
  try {
    let absolutePath: string;

    if (path.isAbsolute(filePathOrUrl)) {
      absolutePath = filePathOrUrl;
    } else if (filePathOrUrl.startsWith('/uploads/')) {
      // Convert public URL to absolute path
      absolutePath = path.join(ROOT_DIR, 'public', filePathOrUrl);
    } else {
      // Treat as a filename within the category directory
      absolutePath = path.join(getUploadDir(category), path.basename(filePathOrUrl));
    }

    // Normalise and guard against path traversal
    const normalised = path.normalize(absolutePath);
    const allowedDir = path.normalize(getUploadDir(category));
    // Also allow under public/uploads for cross-category safety
    const publicUploads = path.normalize(path.join(ROOT_DIR, 'public', 'uploads'));

    const within =
      normalised.startsWith(allowedDir + path.sep) ||
      normalised.startsWith(allowedDir) ||
      normalised.startsWith(publicUploads + path.sep);

    if (!within) {
      console.warn(`[upload] Refused to delete path outside upload dirs: ${normalised}`);
      return;
    }

    if (fs.existsSync(normalised)) {
      fs.unlinkSync(normalised);
    }
  } catch (err) {
    console.error('[upload] Failed to delete file:', err);
  }
}
