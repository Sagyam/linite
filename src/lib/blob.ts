import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { env } from '@/lib/env';
import { RETRY_CONFIG } from '@/lib/constants';

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
 * Calculate retry delay with exponential backoff and jitter
 * @param attemptNumber - The current retry attempt (0-indexed)
 * @returns Delay in milliseconds
 */
function calculateRetryDelay(attemptNumber: number): number {
  const baseDelay = RETRY_CONFIG.INITIAL_RETRY_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attemptNumber);
  const cappedDelay = Math.min(baseDelay, RETRY_CONFIG.MAX_RETRY_DELAY);

  // Add jitter to avoid thundering herd
  const jitter = cappedDelay * RETRY_CONFIG.JITTER_FACTOR * (Math.random() - 0.5);

  return Math.round(cappedDelay + jitter);
}

/**
 * Check if URL is from Wikipedia/Wikimedia
 */
function isWikipediaUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('wikimedia.org') || urlObj.hostname.includes('wikipedia.org');
  } catch {
    return false;
  }
}

/**
 * Create fetch headers with Wikipedia authentication if available
 */
function createFetchHeaders(url: string): HeadersInit {
  const headers: HeadersInit = {
    'User-Agent': 'Linite/1.0 (https://github.com/sagyamthapa/linite; sagyamthapa32@gmail.com)',
  };

  // Add Wikipedia OAuth authentication if credentials are available and URL is Wikipedia
  if (isWikipediaUrl(url) && env.WIKIPEDIA_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${env.WIKIPEDIA_ACCESS_TOKEN}`;
  }

  return headers;
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(response: Response): boolean {
  return response.status === 429 || response.status === 503;
}

/**
 * Download image with retry logic
 * @param imageUrl - URL to download from
 * @param slug - Slug for logging
 * @returns Response and ArrayBuffer, or null if failed
 */
async function downloadImageWithRetry(
  imageUrl: string,
  slug: string
): Promise<{ response: Response; arrayBuffer: ArrayBuffer } | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
    try {
      const headers = createFetchHeaders(imageUrl);
      const response = await fetch(imageUrl, { headers });

      // If rate limited, retry with exponential backoff
      if (isRateLimitError(response)) {
        if (attempt < RETRY_CONFIG.MAX_RETRIES) {
          const retryDelay = calculateRetryDelay(attempt);
          console.log(`  ⏳ ${slug}: Rate limited (${response.status}). Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        } else {
          console.error(`  ❌ ${slug}: Rate limited after ${RETRY_CONFIG.MAX_RETRIES} retries`);
          return null;
        }
      }

      // If other error status, check if we should retry
      if (!response.ok) {
        // Retry on server errors (5xx) but not client errors (4xx except 429)
        if (response.status >= 500 && attempt < RETRY_CONFIG.MAX_RETRIES) {
          const retryDelay = calculateRetryDelay(attempt);
          console.log(`  ⏳ ${slug}: Server error (${response.status}). Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        console.error(`  ❌ ${slug}: HTTP ${response.status} - ${response.statusText}`);
        return null;
      }

      // Success - download the content
      const arrayBuffer = await response.arrayBuffer();
      return { response, arrayBuffer };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < RETRY_CONFIG.MAX_RETRIES) {
        const retryDelay = calculateRetryDelay(attempt);
        console.log(`  ⏳ ${slug}: Network error. Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
    }
  }

  // All retries exhausted
  console.error(`  ❌ ${slug}: Failed after ${RETRY_CONFIG.MAX_RETRIES} retries. Last error: ${lastError?.message || 'Unknown'}`);
  return null;
}

/**
 * Download an image from a URL and upload it to Azure Blob storage
 * Now with robust retry logic and Wikipedia authentication
 * @param imageUrl - The URL of the image to download
 * @param slug - The slug to use in the pathname (e.g., 'firefox', 'ubuntu')
 * @param prefix - The folder prefix for the blob (e.g., 'app-icons', 'distro-icons'). Defaults to 'app-icons'
 * @returns The URL of the uploaded file in Azure Blob, or null if failed
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  slug: string,
  prefix: string = 'app-icons'
): Promise<string | null> {
  try {
    // Download the image with retry logic
    const downloadResult = await downloadImageWithRetry(imageUrl, slug);

    if (!downloadResult) {
      return null;
    }

    const { response, arrayBuffer } = downloadResult;

    // Get the content type and determine file extension
    const contentType = response.headers.get('content-type') || 'image/png';
    let extension = 'png';
    if (contentType.includes('svg')) {
      extension = 'svg';
    } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      extension = 'jpg';
    } else if (contentType.includes('webp')) {
      extension = 'webp';
    }

    // Upload to Azure Blob with overwrite
    const filename = `${slug}.${extension}`;
    const pathname = `${prefix}/${filename}`;

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
      console.error(`  ❌ ${slug}: Azure upload failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.error(`  ❌ ${slug}: Unexpected error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}