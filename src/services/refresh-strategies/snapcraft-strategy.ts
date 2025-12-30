import { RefreshStrategy, PackageMetadata } from './types';
import { getSnapcraftPackageMetadata, checkSnapcraftAvailability } from '../external-apis/snapcraft';

export class SnapcraftRefreshStrategy implements RefreshStrategy {
  async getMetadata(identifier: string): Promise<PackageMetadata | null> {
    return await getSnapcraftPackageMetadata(identifier);
  }

  async checkAvailability(identifier: string): Promise<boolean> {
    return await checkSnapcraftAvailability(identifier);
  }
}
