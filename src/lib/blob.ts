import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { env } from '@/lib/env';
import { RETRY_CONFIG } from '@/lib/constants';
import { generateImageVariants, getExtensionFromContentType, shouldOptimizeImage } from '@/lib/image-optimizer';

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

export interface UploadResult {
  original: string;
  variants: Record<number, string>;
}

/**
 * Upload an image to Azure Blob storage with optimized variants
 * @param file - The file to upload
 * @param pathname - Optional pathname for the file (e.g., 'app-icons/firefox.png')
 * @returns Object with original URL and variant URLs
 */
export async function uploadImage(
  file: File,
  pathname?: string
): Promise<UploadResult> {
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
  const arrayBuffer = await file.arrayBuffer();

  // Check if we should optimize this image
  const optimize = shouldOptimizeImage(file.type);

  if (optimize) {
    // Extract base pathname (without extension) and prefix
    const lastSlashIndex = finalPathname.lastIndexOf('/');
    const prefix = lastSlashIndex >= 0 ? finalPathname.substring(0, lastSlashIndex) : '';
    const filename = lastSlashIndex >= 0 ? finalPathname.substring(lastSlashIndex + 1) : finalPathname;
    const baseFilename = filename.substring(0, filename.lastIndexOf('.'));
    const extension = getExtensionFromContentType(file.type);

    // Upload original file
    const originalPathname = `${prefix}/${baseFilename}-original.${extension}`;
    const originalBlobClient = containerClient.getBlockBlobClient(originalPathname);
    await originalBlobClient.uploadData(arrayBuffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
      },
    });
    const originalUrl = originalBlobClient.url.split('?')[0];

    // Generate and upload variants
    const { variants: imageVariants } = await generateImageVariants(arrayBuffer, file.type);
    const variantUrls: Record<number, string> = {};

    for (const variant of imageVariants) {
      const variantPathname = `${prefix}/${baseFilename}-${variant.size}.webp`;
      const variantBlobClient = containerClient.getBlockBlobClient(variantPathname);
      await variantBlobClient.uploadData(variant.buffer, {
        blobHTTPHeaders: {
          blobContentType: 'image/webp',
        },
      });
      variantUrls[variant.size] = variantBlobClient.url.split('?')[0];
    }

    return {
      original: originalUrl,
      variants: variantUrls,
    };
  } else {
    // For SVG, just upload as-is
    const blockBlobClient = containerClient.getBlockBlobClient(finalPathname);
    await blockBlobClient.uploadData(arrayBuffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
      },
    });
    const url = blockBlobClient.url.split('?')[0];

    return {
      original: url,
      variants: {},
    };
  }
}

/**
 * Delete an image and all its variants from Azure Blob storage
 * @param url - The URL of the file to delete
 */
export async function deleteImage(url: string): Promise<void> {
  const containerClient = getContainerClient();

  // Extract blob name from URL
  // URL format: https://linite.blob.core.windows.net/linite-icons/app-icons/firefox.png
  // Or: https://linite.blob.core.windows.net/linite-icons/app-icons/firefox-64.webp
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  // Skip first two parts (empty string and container name)
  const blobName = pathParts.slice(2).join('/');

  // Delete the specific blob
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();

  // Extract base filename to delete all related files
  // E.g., "app-icons/firefox-64.webp" -> "app-icons/firefox"
  // Or "app-icons/firefox-original.png" -> "app-icons/firefox"
  const lastSlashIndex = blobName.lastIndexOf('/');
  const prefix = lastSlashIndex >= 0 ? blobName.substring(0, lastSlashIndex) : '';
  const filename = lastSlashIndex >= 0 ? blobName.substring(lastSlashIndex + 1) : blobName;

  // Extract base filename (remove size suffix or -original)
  let baseFilename = filename;
  if (filename.includes('-original.')) {
    baseFilename = filename.substring(0, filename.indexOf('-original.'));
  } else if (filename.match(/-\d+\.webp$/)) {
    baseFilename = filename.substring(0, filename.lastIndexOf('-'));
  } else {
    // Legacy format without suffix - just remove extension
    baseFilename = filename.substring(0, filename.lastIndexOf('.'));
  }

  // Delete all variants and original
  const variantSizes = [16, 32, 48, 64, 96, 128];
  const extensions = ['png', 'jpg', 'jpeg', 'webp', 'svg'];

  // Delete variants
  for (const size of variantSizes) {
    const variantPath = `${prefix}/${baseFilename}-${size}.webp`;
    const variantClient = containerClient.getBlockBlobClient(variantPath);
    await variantClient.deleteIfExists();
  }

  // Delete original files
  for (const ext of extensions) {
    const originalPath = `${prefix}/${baseFilename}-original.${ext}`;
    const originalClient = containerClient.getBlockBlobClient(originalPath);
    await originalClient.deleteIfExists();
  }

  // Delete legacy format (single file)
  for (const ext of extensions) {
    const legacyPath = `${prefix}/${baseFilename}.${ext}`;
    const legacyClient = containerClient.getBlockBlobClient(legacyPath);
    await legacyClient.deleteIfExists();
  }
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
 * Check if a blob exists in Azure Blob Storage
 * @param pathname - The full pathname of the blob (e.g., 'app-icons/firefox.svg')
 * @returns The blob URL if it exists, null otherwise
 */
export async function checkBlobExists(pathname: string): Promise<string | null> {
  try {
    const containerClient = getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(pathname);

    const exists = await blockBlobClient.exists();
    if (exists) {
      return blockBlobClient.url.split('?')[0];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Download an image from a URL and upload it to Azure Blob storage with optimized variants
 * Now with robust retry logic and Wikipedia authentication
 * @param imageUrl - The URL of the image to download
 * @param slug - The slug to use in the pathname (e.g., 'firefox', 'ubuntu')
 * @param prefix - The folder prefix for the blob (e.g., 'app-icons', 'distro-icons'). Defaults to 'app-icons'
 * @param skipIfExists - If true, skip upload if blob already exists. Defaults to false
 * @returns Upload result with original and variant URLs, or null if failed
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  slug: string,
  prefix: string = 'app-icons',
  skipIfExists: boolean = false
): Promise<UploadResult | null> {
  try {
    // Check if blob already exists (optimization to skip re-uploads)
    if (skipIfExists) {
      // Try common variant patterns first (check for optimized versions)
      const variantSizes = [16, 32, 48, 64, 96, 128];
      const variantUrls: Record<number, string> = {};
      let hasVariants = false;

      for (const size of variantSizes) {
        const variantPathname = `${prefix}/${slug}-${size}.webp`;
        const existingUrl = await checkBlobExists(variantPathname);
        if (existingUrl) {
          variantUrls[size] = existingUrl;
          hasVariants = true;
        }
      }

      // If we have variants, also check for original
      if (hasVariants) {
        const extensions = ['svg', 'png', 'jpg', 'webp'];
        for (const ext of extensions) {
          const originalPathname = `${prefix}/${slug}-original.${ext}`;
          const existingOriginal = await checkBlobExists(originalPathname);
          if (existingOriginal) {
            return {
              original: existingOriginal,
              variants: variantUrls,
            };
          }
        }
        // If no original found but we have variants, return with first variant as original
        const firstVariant = variantUrls[64] || Object.values(variantUrls)[0];
        return {
          original: firstVariant || '',
          variants: variantUrls,
        };
      }

      // Try legacy format (single file without variants)
      const legacyExtensions = ['svg', 'png', 'jpg', 'webp'];
      for (const ext of legacyExtensions) {
        const pathname = `${prefix}/${slug}.${ext}`;
        const existingUrl = await checkBlobExists(pathname);
        if (existingUrl) {
          return {
            original: existingUrl,
            variants: {},
          };
        }
      }
    }

    // Download the image with retry logic
    const downloadResult = await downloadImageWithRetry(imageUrl, slug);

    if (!downloadResult) {
      return null;
    }

    const { response, arrayBuffer } = downloadResult;

    // Get the content type and determine file extension
    const contentType = response.headers.get('content-type') || 'image/png';
    const extension = getExtensionFromContentType(contentType);

    // Check if we should optimize this image
    const optimize = shouldOptimizeImage(contentType);

    try {
      const containerClient = getContainerClient();

      if (optimize) {
        // Upload original file
        const originalPathname = `${prefix}/${slug}-original.${extension}`;
        const originalBlobClient = containerClient.getBlockBlobClient(originalPathname);
        await originalBlobClient.uploadData(arrayBuffer, {
          blobHTTPHeaders: {
            blobContentType: contentType,
          },
        });
        const originalUrl = originalBlobClient.url.split('?')[0];

        // Generate and upload variants
        const { variants: imageVariants } = await generateImageVariants(arrayBuffer, contentType);
        const variantUrls: Record<number, string> = {};

        for (const variant of imageVariants) {
          const variantPathname = `${prefix}/${slug}-${variant.size}.webp`;
          const variantBlobClient = containerClient.getBlockBlobClient(variantPathname);
          await variantBlobClient.uploadData(variant.buffer, {
            blobHTTPHeaders: {
              blobContentType: 'image/webp',
            },
          });
          variantUrls[variant.size] = variantBlobClient.url.split('?')[0];
        }

        return {
          original: originalUrl,
          variants: variantUrls,
        };
      } else {
        // For SVG, just upload as-is
        const filename = `${slug}.${extension}`;
        const pathname = `${prefix}/${filename}`;
        const blockBlobClient = containerClient.getBlockBlobClient(pathname);

        await blockBlobClient.uploadData(arrayBuffer, {
          blobHTTPHeaders: {
            blobContentType: contentType,
          },
        });

        const url = blockBlobClient.url.split('?')[0];
        return {
          original: url,
          variants: {},
        };
      }
    } catch (error) {
      console.error(`  ❌ ${slug}: Azure upload failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.error(`  ❌ ${slug}: Unexpected error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}