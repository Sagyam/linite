import { put, del, list } from '@vercel/blob';
import { env } from '@/lib/env';

/**
 * Upload an image to Vercel Blob storage
 * @param file - The file to upload
 * @param pathname - Optional pathname for the file (e.g., 'app-icons/firefox.png')
 * @returns The URL of the uploaded file
 */
export async function uploadImage(
  file: File,
  pathname?: string
): Promise<string> {
  const token = env.BLOB_READ_WRITE_TOKEN;

  // Validate a file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only PNG, JPEG, WebP, and SVG are allowed.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }

  // Generate pathname if not provided
  const finalPathname = pathname || `app-icons/${Date.now()}-${file.name}`;

  const blob = await put(finalPathname, file, {
    access: 'public',
    token,
  });

  return blob.url;
}

/**
 * Delete an image from Vercel Blob storage
 * @param url - The URL of the file to delete
 */
export async function deleteImage(url: string): Promise<void> {
  const token = env.BLOB_READ_WRITE_TOKEN;
  await del(url, { token });
}

/**
 * List all images in a specific folder
 * @param prefix - The folder prefix (e.g., 'app-icons/')
 */
export async function listImages(prefix?: string) {
  const token = env.BLOB_READ_WRITE_TOKEN;

  return await list({
    token,
    prefix: prefix || 'app-icons/',
  });
}