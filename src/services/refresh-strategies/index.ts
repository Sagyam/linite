import { RefreshStrategy } from './types';
import { FlathubRefreshStrategy } from './flathub-strategy';
import { SnapcraftRefreshStrategy } from './snapcraft-strategy';
import { AURRefreshStrategy } from './aur-strategy';

/**
 * Registry of refresh strategies by source slug
 * Makes it easy to add new sources by simply adding a new strategy
 */
export const refreshStrategies: Record<string, RefreshStrategy> = {
  flatpak: new FlathubRefreshStrategy(),
  snap: new SnapcraftRefreshStrategy(),
  aur: new AURRefreshStrategy(),
};

/**
 * Get the refresh strategy for a given source slug
 * @param sourceSlug - The source slug (e.g., 'flatpak', 'snap', 'aur')
 * @returns The refresh strategy or null if not found
 */
export function getRefreshStrategy(sourceSlug: string): RefreshStrategy | null {
  return refreshStrategies[sourceSlug] || null;
}

export type { RefreshStrategy, PackageMetadata } from './types';
