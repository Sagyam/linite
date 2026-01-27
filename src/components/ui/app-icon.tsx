'use client';

import { cn } from '@/lib/utils';
import { IMAGES, ICON_SIZES } from '@/lib/constants';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface AppIconProps {
  iconUrl: string | null;
  displayName: string;
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
  rounded?: 'default' | 'lg' | 'full';
}

const SIZE_MAP = {
  sm: ICON_SIZES.SM,
  md: ICON_SIZES.MD,
  lg: ICON_SIZES.LG,
} as const;

const ROUNDED_MAP = {
  default: 'rounded',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

export function AppIcon({
  iconUrl,
  displayName,
  size = 'md',
  className,
  rounded = 'default',
}: AppIconProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const roundedClass = ROUNDED_MAP[rounded];

  return (
    <OptimizedImage
      src={iconUrl || IMAGES.FALLBACK_ICON}
      alt={displayName}
      width={pixelSize}
      height={pixelSize}
      className={cn(roundedClass, 'object-contain flex-shrink-1', className)}
      onError={(e) => {
        e.currentTarget.src = IMAGES.FALLBACK_ICON;
      }}
    />
  );
}
