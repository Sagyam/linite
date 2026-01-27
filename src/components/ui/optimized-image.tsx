'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

/**
 * Available image variant sizes (must match IMAGE_VARIANT_SIZES in image-optimizer.ts)
 */
const AVAILABLE_SIZES = [16, 32, 48, 64, 96, 128] as const;

/**
 * Get the optimal image variant URL based on the requested width
 * @param src - The original image source URL
 * @param width - The requested width in pixels
 * @returns The optimal variant URL or the original URL
 */
function getOptimalVariantUrl(src: string, width: number): string {
  // Only optimize Azure blob URLs
  if (!src.includes('linite.blob.core.windows.net')) {
    return src;
  }

  // Don't optimize SVG files
  if (src.endsWith('.svg')) {
    return src;
  }

  // If it's already a variant URL, return as-is
  if (src.match(/-\d+\.webp$/)) {
    return src;
  }

  // If it's an original URL, extract base and construct variant
  // E.g., "app-icons/firefox-original.png" -> "app-icons/firefox"
  let basePath = src;
  if (src.includes('-original.')) {
    basePath = src.substring(0, src.indexOf('-original.'));
  } else {
    // Legacy format: remove extension
    const lastDot = src.lastIndexOf('.');
    if (lastDot > 0) {
      basePath = src.substring(0, lastDot);
    }
  }

  // Find the optimal size (smallest that's >= requested width)
  // Consider device pixel ratio for retina displays
  const targetSize = typeof window !== 'undefined'
    ? Math.ceil(width * (window.devicePixelRatio || 1))
    : width;

  const optimalSize = AVAILABLE_SIZES.find(s => s >= targetSize) || AVAILABLE_SIZES[AVAILABLE_SIZES.length - 1];

  // Construct variant URL
  return `${basePath}-${optimalSize}.webp`;
}

/**
 * OptimizedImage component that bypasses Vercel's image optimization
 * and intelligently selects pre-generated image variants
 *
 * This component:
 * - Serves pre-optimized WebP variants from Azure Blob Storage
 * - Selects the optimal size variant based on requested dimensions
 * - Bypasses Vercel's image optimization to avoid 402 payment errors
 * - Falls back to original image if variant is not found
 * - Supports all Next.js Image component features (lazy loading, etc.)
 */
export function OptimizedImage(props: ImageProps) {
  const { src, width, onError, ...restProps } = props;
  const [currentSrc, setCurrentSrc] = useState(() => {
    // For static imports or non-string sources, return as-is
    if (typeof src !== 'string') return src;
    if (typeof width !== 'number') return src;
    return getOptimalVariantUrl(src, width);
  });

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    // If variant fails to load, try the original image
    if (typeof src === 'string' && typeof currentSrc === 'string' && currentSrc !== src) {
      // Try to load original URL
      if (currentSrc.match(/-\d+\.webp$/)) {
        // Construct original URL from variant
        const baseUrl = currentSrc.substring(0, currentSrc.lastIndexOf('-'));
        // Try common extensions
        const extensions = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
        for (const ext of extensions) {
          const originalUrl = `${baseUrl}-original.${ext}`;
          setCurrentSrc(originalUrl);
          return;
        }
      }
      // Fallback to provided src
      setCurrentSrc(src);
    }

    // Call the original onError handler if provided
    if (onError) {
      onError(e);
    }
  };

  return (
    <Image
      {...restProps}
      src={currentSrc}
      width={width}
      onError={handleError}
      unoptimized={true} // KEY: Bypass Vercel's image optimization
    />
  );
}
