import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { env } from '@/lib/env';

/**
 * Parse Azure Blob Storage SAS URL to extract account, container, and token
 */
function parseSasUrl(sasUrl: string): { accountName: string; containerName: string; sasToken: string } {
  const url = new URL(sasUrl);

  // Extract account name from hostname (e.g., "linite.blob.core.windows.net" -> "linite")
  const accountName = url.hostname.split('.')[0];

  // Extract container name from pathname (e.g., "/linite-icons" -> "linite-icons")
  const containerName = url.pathname.split('/')[1];

  // Extract SAS token from search params (everything after "?")
  const sasToken = url.search;

  return { accountName, containerName, sasToken };
}

/**
 * Get Azure Blob Container Client
 */
function getContainerClient(): ContainerClient {
  const sasUrl = env.AZURE_STORAGE_SAS_URL;
  const { accountName, containerName, sasToken } = parseSasUrl(sasUrl);

  // Create BlobServiceClient with SAS token
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net${sasToken}`
  );

  return blobServiceClient.getContainerClient(containerName);
}

/**
 * Upload an image to Azure Blob storage
 * @param file - The file to upload
 * @param pathname - Optional pathname for the file (e.g., 'app-icons/firefox.png')
 * @returns The URL of the uploaded file
 */
export async function uploadImage(
  file: File,
  pathname?: string
): Promise<string> {
  // Validate file type
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

  const containerClient = getContainerClient();
  const blockBlobClient = containerClient.getBlockBlobClient(finalPathname);

  // Convert File to ArrayBuffer and upload
  const arrayBuffer = await file.arrayBuffer();
  await blockBlobClient.uploadData(arrayBuffer, {
    blobHTTPHeaders: {
      blobContentType: file.type,
    },
  });

  // Return the public URL (without SAS token for security)
  return blockBlobClient.url.split('?')[0];
}

/**
 * Delete an image from Azure Blob storage
 * @param url - The URL of the file to delete
 */
export async function deleteImage(url: string): Promise<void> {
  const containerClient = getContainerClient();

  // Extract blob name from URL
  // URL format: https://linite.blob.core.windows.net/linite-icons/app-icons/firefox.png
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  // Skip first two parts (empty string and container name)
  const blobName = pathParts.slice(2).join('/');

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

/**
 * List all images in a specific folder
 * @param prefix - The folder prefix (e.g., 'app-icons/')
 */
export async function listImages(prefix?: string) {
  const containerClient = getContainerClient();
  const blobPrefix = prefix || 'app-icons/';

  const blobs: Array<{ url: string; pathname: string; size: number; uploadedAt: Date }> = [];

  for await (const blob of containerClient.listBlobsFlat({ prefix: blobPrefix })) {
    if (blob.name) {
      const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
      blobs.push({
        url: blockBlobClient.url.split('?')[0],
        pathname: blob.name,
        size: blob.properties.contentLength || 0,
        uploadedAt: blob.properties.createdOn || new Date(),
      });
    }
  }

  return { blobs };
}

/**
 * Download an image from a URL and upload it to Azure Blob storage
 * @param imageUrl - The URL of the image to download
 * @param appSlug - The app slug to use in the pathname (e.g., 'firefox')
 * @returns The URL of the uploaded file in Azure Blob, or null if failed
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

    // Upload to Azure Blob with overwrite
    const pathname = `app-icons/${filename}`;

    try {
      const containerClient = getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(pathname);

      // Upload with overwrite enabled
      await blockBlobClient.uploadData(arrayBuffer, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });

      return blockBlobClient.url.split('?')[0];
    } catch (error) {
      console.error(`Failed to upload icon for ${appSlug}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`Error uploading icon from URL ${imageUrl}:`, error);
    return null;
  }
}