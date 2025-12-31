import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SimpleCache } from './types';

describe('SimpleCache', () => {
  let cache: SimpleCache<string>;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create cache with default 15 minute TTL', () => {
      cache = new SimpleCache<string>();
      expect(cache).toBeDefined();
    });

    it('should create cache with custom TTL', () => {
      cache = new SimpleCache<string>(30);
      cache.set('key', 'value');

      // Should still be valid after 29 minutes
      vi.advanceTimersByTime(29 * 60 * 1000);
      expect(cache.get('key')).toBe('value');

      // Should expire after 30 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(cache.get('key')).toBeNull();
    });
  });

  describe('set and get', () => {
    beforeEach(() => {
      cache = new SimpleCache<string>(15);
    });

    it('should store and retrieve a value', () => {
      cache.set('test-key', 'test-value');
      expect(cache.get('test-key')).toBe('test-value');
    });

    it('should return null for non-existent key', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should overwrite existing key', () => {
      cache.set('key', 'value1');
      cache.set('key', 'value2');
      expect(cache.get('key')).toBe('value2');
    });

    it('should handle different data types', () => {
      const objectCache = new SimpleCache<{ name: string; age: number }>(15);
      const arrayCache = new SimpleCache<number[]>(15);

      objectCache.set('user', { name: 'John', age: 30 });
      arrayCache.set('numbers', [1, 2, 3]);

      expect(objectCache.get('user')).toEqual({ name: 'John', age: 30 });
      expect(arrayCache.get('numbers')).toEqual([1, 2, 3]);
    });
  });

  describe('TTL expiration', () => {
    beforeEach(() => {
      cache = new SimpleCache<string>(15); // 15 minutes
    });

    it('should return value before expiration', () => {
      cache.set('key', 'value');

      // Advance time by 14 minutes (before expiration)
      vi.advanceTimersByTime(14 * 60 * 1000);

      expect(cache.get('key')).toBe('value');
    });

    it('should return null after expiration', () => {
      cache.set('key', 'value');

      // Advance time by 16 minutes (after 15 minute expiration)
      vi.advanceTimersByTime(16 * 60 * 1000);

      expect(cache.get('key')).toBeNull();
    });

    it('should delete expired entry on get', () => {
      cache.set('key', 'value');

      // Advance time past expiration
      vi.advanceTimersByTime(20 * 60 * 1000);

      // First get should return null and delete the entry
      expect(cache.get('key')).toBeNull();

      // Second get should also return null (entry was deleted)
      expect(cache.get('key')).toBeNull();
    });

    it('should handle multiple entries with different expiration times', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      cache.set('key1', 'value1');

      vi.advanceTimersByTime(5 * 60 * 1000);
      cache.set('key2', 'value2');

      vi.advanceTimersByTime(5 * 60 * 1000);
      cache.set('key3', 'value3');

      // At 10 minutes, all should be valid
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');

      // At 16 minutes, key1 should expire (set at 0, expires at 15)
      vi.advanceTimersByTime(6 * 60 * 1000);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');

      // At 21 minutes, key2 should also expire (set at 5, expires at 20)
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBe('value3');

      // At 26 minutes, key3 should also expire (set at 10, expires at 25)
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      cache = new SimpleCache<string>(15);
    });

    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });

    it('should allow setting new entries after clear', () => {
      cache.set('key1', 'value1');
      cache.clear();
      cache.set('key2', 'value2');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      cache = new SimpleCache<string>(15);
    });

    it('should remove only expired entries', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      cache.set('key1', 'value1');

      vi.advanceTimersByTime(10 * 60 * 1000);
      cache.set('key2', 'value2');

      // Advance to 16 minutes (key1 expired, key2 still valid)
      vi.advanceTimersByTime(6 * 60 * 1000);

      cache.cleanup();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should not remove valid entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Advance time by 5 minutes (still valid)
      vi.advanceTimersByTime(5 * 60 * 1000);

      cache.cleanup();

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
    });

    it('should remove all entries if all are expired', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Advance time past expiration
      vi.advanceTimersByTime(20 * 60 * 1000);

      cache.cleanup();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });

    it('should do nothing on empty cache', () => {
      expect(() => cache.cleanup()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle zero TTL', () => {
      cache = new SimpleCache<string>(0);
      cache.set('key', 'value');

      // Should expire immediately
      vi.advanceTimersByTime(1);
      expect(cache.get('key')).toBeNull();
    });

    it('should handle very large TTL', () => {
      cache = new SimpleCache<string>(60 * 24 * 365); // 1 year
      cache.set('key', 'value');

      // Should still be valid after 30 days
      vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000);
      expect(cache.get('key')).toBe('value');
    });

    it('should handle empty string as value', () => {
      cache = new SimpleCache<string>(15);
      cache.set('key', '');
      expect(cache.get('key')).toBe('');
    });

    it('should handle null-like values correctly', () => {
      const nullableCache = new SimpleCache<string | null>(15);
      nullableCache.set('key', null);
      // Note: We're storing null, not missing the key
      expect(nullableCache.get('key')).toBe(null);
    });
  });
});
