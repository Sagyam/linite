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
    addRandomSuffix: false,
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
  const token = env.BLOB_READ_WRITE_TOKEN;

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

    // Upload to Vercel Blob with overwrite handling
    const pathname = `app-icons/${filename}`;

    // Try to upload, if it exists, delete and re-upload
    try {
      const uploadedBlob = await put(pathname, file, {
        access: 'public',
        token,
        addRandomSuffix: false,
      });
      return uploadedBlob.url;
    } catch (error) {
      // If a blob exists, we need to handle it differently
      // Try to get the existing blob URL and delete it first
      if (error instanceof Error && error.message.includes('already exists')) {
        try {
          // List blobs with this pathname to get the URL
          const { blobs } = await list({
            token,
            prefix: pathname,
          });

          // Delete existing blob if found
          if (blobs.length > 0) {
            await del(blobs[0].url, { token });
          }

          // Now upload again
          const uploadedBlob = await put(pathname, file, {
            access: 'public',
            token,
            addRandomSuffix: false,
          });
          return uploadedBlob.url;
        } catch (retryError) {
          console.error(`Failed to overwrite icon for ${appSlug}:`, retryError);
          return null;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error uploading icon from URL ${imageUrl}:`, error);
    return null;
  }
}