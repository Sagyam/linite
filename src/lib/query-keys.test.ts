import { describe, it, expect } from 'vitest';
import { queryKeys, type QueryKeys, type QueryKey } from './query-keys';

describe('queryKeys', () => {
  describe('apps', () => {
    it('should have correct base key', () => {
      expect(queryKeys.apps.all).toEqual(['apps']);
    });

    it('should have lists key factory', () => {
      expect(queryKeys.apps.lists()).toEqual(['apps', 'list']);
    });

    it('should create list key with params', () => {
      const params = { category: 'test', search: 'app' };
      expect(queryKeys.apps.list(params)).toEqual(['apps', 'list', params]);
    });

    it('should have details key factory', () => {
      expect(queryKeys.apps.details()).toEqual(['apps', 'detail']);
    });

    it('should create detail key by ID', () => {
      expect(queryKeys.apps.detail('app-1')).toEqual(['apps', 'detail', 'app-1']);
    });

    it('should create detail key by slug', () => {
      expect(queryKeys.apps.detailBySlug('test-app')).toEqual(['apps', 'detail', 'slug', 'test-app']);
    });

    it('should create batch fetch key with sorted IDs', () => {
      const ids = ['app-3', 'app-1', 'app-2'];
      expect(queryKeys.apps.byIds(ids)).toEqual(['apps', 'batch', ['app-1', 'app-2', 'app-3']]);
    });

    it('should create selection key with sorted IDs', () => {
      const ids = ['app-2', 'app-1'];
      expect(queryKeys.apps.selection(ids)).toEqual(['apps', 'selection', ['app-1', 'app-2']]);
    });
  });

  describe('categories', () => {
    it('should have correct base key', () => {
      expect(queryKeys.categories.all).toEqual(['categories']);
    });

    it('should have lists key factory', () => {
      expect(queryKeys.categories.lists()).toEqual(['categories', 'list']);
    });

    it('should create list key', () => {
      expect(queryKeys.categories.list()).toEqual(['categories', 'list']);
    });

    it('should create detail key', () => {
      expect(queryKeys.categories.detail('cat-1')).toEqual(['categories', 'detail', 'cat-1']);
    });
  });

  describe('distros', () => {
    it('should have correct base key', () => {
      expect(queryKeys.distros.all).toEqual(['distros']);
    });

    it('should have lists key factory', () => {
      expect(queryKeys.distros.lists()).toEqual(['distros', 'list']);
    });

    it('should create list key', () => {
      expect(queryKeys.distros.list()).toEqual(['distros', 'list']);
    });

    it('should create detail key', () => {
      expect(queryKeys.distros.detail('distro-1')).toEqual(['distros', 'detail', 'distro-1']);
    });

    it('should create detail key by slug', () => {
      expect(queryKeys.distros.detailBySlug('ubuntu')).toEqual(['distros', 'detail', 'slug', 'ubuntu']);
    });
  });

  describe('sources', () => {
    it('should have correct base key', () => {
      expect(queryKeys.sources.all).toEqual(['sources']);
    });

    it('should have lists key factory', () => {
      expect(queryKeys.sources.lists()).toEqual(['sources', 'list']);
    });

    it('should create list key', () => {
      expect(queryKeys.sources.list()).toEqual(['sources', 'list']);
    });

    it('should create detail key', () => {
      expect(queryKeys.sources.detail('src-1')).toEqual(['sources', 'detail', 'src-1']);
    });
  });

  describe('collections', () => {
    it('should have correct base key', () => {
      expect(queryKeys.collections.all).toEqual(['collections']);
    });

    it('should have lists key factory', () => {
      expect(queryKeys.collections.lists()).toEqual(['collections', 'list']);
    });

    it('should create list key without params', () => {
      expect(queryKeys.collections.list()).toEqual(['collections', 'list']);
    });

    it('should create list key with params', () => {
      const params = { featured: true, userId: 'user-1' };
      expect(queryKeys.collections.list(params)).toEqual(['collections', 'list', params]);
    });

    it('should create detail key', () => {
      expect(queryKeys.collections.detail('coll-1')).toEqual(['collections', 'detail', 'coll-1']);
    });

    it('should create detail key by slug', () => {
      expect(queryKeys.collections.detailBySlug('my-collection')).toEqual(['collections', 'detail', 'slug', 'my-collection']);
    });
  });

  describe('commands', () => {
    it('should have correct base key', () => {
      expect(queryKeys.commands.all).toEqual(['commands']);
    });

    it('should create generate key without source preference', () => {
      const key = queryKeys.commands.generate('ubuntu', ['app-1', 'app-2']);
      expect(key).toEqual(['commands', 'generate', { distroSlug: 'ubuntu', appIds: ['app-1', 'app-2'], sourcePreference: undefined }]);
    });

    it('should create generate key with source preference', () => {
      const key = queryKeys.commands.generate('ubuntu', ['app-2', 'app-1'], 'flatpak');
      expect(key).toEqual(['commands', 'generate', { distroSlug: 'ubuntu', appIds: ['app-1', 'app-2'], sourcePreference: 'flatpak' }]);
    });

    it('should sort app IDs in generate key', () => {
      const key1 = queryKeys.commands.generate('ubuntu', ['app-3', 'app-1', 'app-2']);
      const key2 = queryKeys.commands.generate('ubuntu', ['app-1', 'app-2', 'app-3']);
      expect(key1).toEqual(key2);
    });
  });

  describe('type safety', () => {
    it('should export QueryKeys type', () => {
      const keys: QueryKeys = queryKeys;
      expect(keys).toBeDefined();
    });

    it('should export QueryKey type helper', () => {
      type TestQueryKey = QueryKey<typeof queryKeys.apps.detail>;
      const key: TestQueryKey = queryKeys.apps.detail('app-1');
      expect(key).toEqual(['apps', 'detail', 'app-1']);
    });
  });

  describe('immutability and consistency', () => {
    it('should return same base key reference', () => {
      const key1 = queryKeys.apps.all;
      const key2 = queryKeys.apps.all;
      expect(key1).toBe(key2);
    });

    it('should return consistent keys for same parameters', () => {
      const key1 = queryKeys.apps.list({ category: 'test' });
      const key2 = queryKeys.apps.list({ category: 'test' });
      expect(key1).toEqual(key2);
    });

    it('should handle different parameters consistently', () => {
      const key1 = queryKeys.apps.list({ category: 'test' });
      const key2 = queryKeys.apps.list({ search: 'test' });
      expect(key1).not.toEqual(key2);
    });
  });
});
