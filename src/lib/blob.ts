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

/**
 * Download an image from a URL and upload it to Vercel Blob storage
 * @param imageUrl - The URL of the image to download
 * @param appSlug - The app slug to use in the pathname (e.g., 'firefox')
 * @returns The URL of the uploaded file in Vercel Blob, or null if failed
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  appSlug: string
): Promise<string | null> {
  try {
    // Download the image from the URL
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error(`Failed to download icon from ${imageUrl}: ${response.status}`);
      return null;
    }

    // Get the content type and convert to blob
    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: contentType });

    // Determine file extension from content type
    let extension = 'png';
    if (contentType.includes('svg')) {
      extension = 'svg';
    } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      extension = 'jpg';
    } else if (contentType.includes('webp')) {
      extension = 'webp';
    }

    // Create a File object from the blob
    const filename = `${appSlug}.${extension}`;
    const file = new File([blob], filename, { type: contentType });

    // Upload to Vercel Blob
    const pathname = `app-icons/${filename}`;
    const uploadedUrl = await uploadImage(file, pathname);

    return uploadedUrl;
  } catch (error) {
    console.error(`Error uploading icon from URL ${imageUrl}:`, error);
    return null;
  }
}