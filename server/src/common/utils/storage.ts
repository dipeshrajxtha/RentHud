import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from '../../../config/env.js';
import { BadRequestError } from '../errors/index.js';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/**
 * Ensures the upload sub-directory exists.
 */
export async function ensureUploadDir(subfolder = 'properties'): Promise<string> {
  const targetDir = path.resolve(process.cwd(), config.storage.uploadDir, subfolder);
  if (!fsSync.existsSync(targetDir)) {
    await fs.mkdir(targetDir, { recursive: true });
  }
  return targetDir;
}

/**
 * Saves a base64 encoded data-URL or raw base64 image string to disk.
 * Returns the public relative URL (e.g. `/uploads/properties/prop_...jpg`).
 */
export async function saveBase64Image(
  dataUrlOrBase64: string,
  subfolder = 'properties'
): Promise<string> {
  // If already a valid URL or path (not base64), return it directly
  if (
    dataUrlOrBase64.startsWith('http://') ||
    dataUrlOrBase64.startsWith('https://') ||
    dataUrlOrBase64.startsWith('/uploads/')
  ) {
    return dataUrlOrBase64;
  }

  let mimeType = 'image/jpeg';
  let base64Data = dataUrlOrBase64;

  const match = dataUrlOrBase64.match(/^data:([^;,]+)(?:;[^,]*)?;base64,([\s\S]+)$/i);
  if (match) {
    mimeType = match[1].toLowerCase().trim();
    base64Data = match[2];
  } else if (dataUrlOrBase64.includes(';base64,')) {
    const commaIndex = dataUrlOrBase64.indexOf(',');
    const header = dataUrlOrBase64.substring(0, commaIndex);
    const mimeMatch = header.match(/^data:([^;,]+)/i);
    if (mimeMatch) {
      mimeType = mimeMatch[1].toLowerCase().trim();
    }
    base64Data = dataUrlOrBase64.substring(commaIndex + 1);
  }

  // Remove whitespace and newlines
  base64Data = base64Data.replace(/\s+/g, '');

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length === 0) {
    throw new BadRequestError('Image data is empty or invalid base64');
  }

  // Sniff magic bytes for accurate extension and validation
  let ext = ALLOWED_MIME_TYPES[mimeType];
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    ext = '.jpg';
  } else if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    ext = '.png';
  } else if (
    buffer.length >= 4 &&
    buffer.subarray(0, 3).toString('ascii') === 'GIF'
  ) {
    ext = '.gif';
  } else if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    ext = '.webp';
  }

  if (!ext) {
    throw new BadRequestError(
      `Unsupported image format (${mimeType}). Allowed: JPG, PNG, WEBP, GIF`
    );
  }

  if (buffer.length > config.storage.maxFileSize) {
    throw new BadRequestError(
      `Image size (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${(
        config.storage.maxFileSize /
        1024 /
        1024
      ).toFixed(0)}MB)`
    );
  }

  const targetDir = await ensureUploadDir(subfolder);
  const filename = `${subfolder}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${ext}`;
  const filePath = path.join(targetDir, filename);

  await fs.writeFile(filePath, buffer);

  return `/uploads/${subfolder}/${filename}`;
}

/**
 * Safely removes a stored image from disk if it exists within the upload directory.
 */
export async function deleteStoredImage(fileUrl: string): Promise<void> {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;

  try {
    const rootUpload = path.resolve(process.cwd(), config.storage.uploadDir);
    const relativePath = fileUrl.replace(/^\/uploads\//, '');
    const absolutePath = path.resolve(rootUpload, relativePath);

    // Prevent directory traversal
    if (!absolutePath.startsWith(rootUpload)) return;

    if (fsSync.existsSync(absolutePath)) {
      await fs.unlink(absolutePath);
    }
  } catch {
    // Silently ignore deletion failures
  }
}
