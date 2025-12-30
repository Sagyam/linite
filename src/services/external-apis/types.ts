/**
 * Shared types for external package API integrations
 */

export interface PackageSearchResult {
  identifier: string; // Package ID (e.g., org.mozilla.firefox, firefox, firefox-bin)
  name: string; // Display name
  summary?: string; // Short description
  description?: string; // Full description
  version?: string;
  homepage?: string;
  iconUrl?: string;
  license?: string;
  maintainer?: string;
  downloadSize?: number; // Size in bytes
  source: 'flatpak' | 'snap' | 'repology' | 'aur';
}

export interface PackageMetadata {
  identifier: string;
  name: string;
  summary?: string;
  description?: string;
  version?: string;
  homepage?: string;
  iconUrl?: string;
  license?: string;
  maintainer?: string;
  downloadSize?: number;
  categories?: string[];
  screenshots?: string[];
  releaseDate?: string;
  source: 'flatpak' | 'snap' | 'repology' | 'aur';
  metadata?: Record<string, unknown>; // Source-specific extra data
}

export interface APIError {
  source: string;
  message: string;
  code?: string;
}

/**
 * Cache entry for API responses
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Simple in-memory cache implementation
 */
export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number; // Time to live in milliseconds

  constructor(ttlMinutes: number = 15) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
