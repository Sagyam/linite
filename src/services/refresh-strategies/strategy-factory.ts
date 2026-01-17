import { RefreshStrategy, PackageMetadata } from './types';

export function createRefreshStrategy(
  getMetadataFn: (identifier: string) => Promise<PackageMetadata | null>,
  checkAvailabilityFn: (identifier: string) => Promise<boolean>
): RefreshStrategy {
  return {
    getMetadata: getMetadataFn,
    checkAvailability: checkAvailabilityFn,
  };
}
