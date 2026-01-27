import sharp from 'sharp';

/**
 * Standard image sizes to generate variants for
 * Matches the ICON_SIZES constants used throughout the app
 */
export const IMAGE_VARIANT_SIZES = [16, 32, 48, 64, 96, 128] as const;

/**
 * WebP quality setting (85 provides good balance between quality and file size)
 */
const WEBP_QUALITY = 85;

export interface ImageVariant {
  size: number;
  buffer: Buffer;
  format: 'webp';
}

export interface OptimizationResult {
  variants: ImageVariant[];
  shouldOptimize: boolean;
}

/**
 * Check if an image should be optimized based on its content type
 * SVG files are excluded from optimization as they're already vector-based
 */
export function shouldOptimizeImage(contentType: string): boolean {
  return !contentType.includes('svg');
}

/**
 * Generate optimized WebP variants of an image at multiple sizes
 * @param arrayBuffer - The original image data
 * @param contentType - The MIME type of the original image
 * @returns Array of image variants with buffers and metadata
 */
export async function generateImageVariants(
  arrayBuffer: ArrayBuffer,
  contentType: string
): Promise<OptimizationResult> {
  // Skip optimization for SVG files
  if (!shouldOptimizeImage(contentType)) {
    return {
      variants: [],
      shouldOptimize: false,
    };
  }

  try {
    const buffer = Buffer.from(arrayBuffer);
    const variants: ImageVariant[] = [];

    // Generate a variant for each size
    for (const size of IMAGE_VARIANT_SIZES) {
      try {
        const resizedBuffer = await sharp(buffer)
          .resize(size, size, {
            fit: 'inside', // Maintain aspect ratio, fit within bounds
            withoutEnlargement: true, // Don't upscale small images
          })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer();

        variants.push({
          size,
          buffer: resizedBuffer,
          format: 'webp',
        });
      } catch (error) {
        console.error(`Failed to generate ${size}px variant: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue with other sizes even if one fails
      }
    }

    return {
      variants,
      shouldOptimize: true,
    };
  } catch (error) {
    console.error(`Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      variants: [],
      shouldOptimize: false,
    };
  }
}

/**
 * Get the file extension from a content type
 */
export function getExtensionFromContentType(contentType: string): string {
  if (contentType.includes('svg')) return 'svg';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('png')) return 'png';
  return 'png'; // Default fallback
}
