import { RefreshStrategy, PackageMetadata } from './types';
import { getFlathubAppMetadata, checkFlathubAvailability } from '../external-apis/flathub';

export class FlathubRefreshStrategy implements RefreshStrategy {
  async getMetadata(identifier: string): Promise<PackageMetadata | null> {
    return await getFlathubAppMetadata(identifier);
  }

  async checkAvailability(identifier: string): Promise<boolean> {
    return await checkFlathubAvailability(identifier);
  }
}
