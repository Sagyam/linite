import { RefreshStrategy, PackageMetadata } from './types';
import { getAURPackageMetadata, checkAURAvailability } from '../external-apis/aur';

export class AURRefreshStrategy implements RefreshStrategy {
  async getMetadata(identifier: string): Promise<PackageMetadata | null> {
    return await getAURPackageMetadata(identifier);
  }

  async checkAvailability(identifier: string): Promise<boolean> {
    return await checkAURAvailability(identifier);
  }
}
