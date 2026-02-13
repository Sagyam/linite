import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { distrosRepository } from './distros.repository';
import type { Distro } from '../types';
import { db } from '../db';

vi.mock('@/db', () => {
  return {
    db: {
      query: {
        distros: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
      },
    },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value, type: 'eq' })),
  desc: vi.fn((column) => ({ column, type: 'desc' })),
  asc: vi.fn((column) => ({ column, type: 'asc' })),
  relations: vi.fn(() => ({})),
}));



describe('DistrosRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDistro: Distro = {
    id: 'distro-1',
    name: 'Ubuntu',
    slug: 'ubuntu',
    family: 'debian',
    iconUrl: 'https://example.com/ubuntu.png',
    basedOn: null,
    isPopular: true,
    themeColorLight: '#E95420',
    themeColorDark: '#77216F',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDistroWithSources = {
    id: 'distro-1',
    name: 'Ubuntu',
    slug: 'ubuntu',
    family: 'debian',
    iconUrl: 'https://example.com/ubuntu.png',
    basedOn: null,
    isPopular: true,
    themeColorLight: '#E95420',
    themeColorDark: '#77216F',
    createdAt: new Date(),
    updatedAt: new Date(),
    distroSources: [
      {
        distroId: 'distro-1',
        sourceId: 'source-1',
        priority: 10,
        isDefault: true,
        source: {
          id: 'source-1',
          name: 'APT',
          slug: 'apt',
        },
      },
      {
        distroId: 'distro-1',
        sourceId: 'source-2',
        priority: 5,
        isDefault: false,
        source: {
          id: 'source-2',
          name: 'Flatpak',
          slug: 'flatpak',
        },
      },
    ],
  };

  describe('findAllOrdered', () => {
    it('should find all distros ordered by popularity and name', async () => {
      (db.query.distros.findMany as Mock).mockResolvedValue([mockDistro]);

      const result = await distrosRepository.findAllOrdered();

      expect(result).toEqual([mockDistro]);
      expect(db.query.distros.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no distros exist', async () => {
      (db.query.distros.findMany as Mock).mockResolvedValue([]);

      const result = await distrosRepository.findAllOrdered();

      expect(result).toEqual([]);
    });

    it('should return multiple distros in order', async () => {
      const multipleDistros = [
        { ...mockDistro, id: 'distro-1', name: 'Ubuntu', isPopular: true },
        { ...mockDistro, id: 'distro-2', name: 'Arch', isPopular: true },
        { ...mockDistro, id: 'distro-3', name: 'Fedora', isPopular: false },
      ];
      (db.query.distros.findMany as Mock).mockResolvedValue(multipleDistros);

      const result = await distrosRepository.findAllOrdered();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Ubuntu');
    });
  });

  describe('findAllWithSourcesNormalized', () => {
    it('should find all distros with normalized sources', async () => {
      (db.query.distros.findMany as Mock).mockResolvedValue([mockDistroWithSources]);

      const result = await distrosRepository.findAllWithSourcesNormalized();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        iconUrl: 'https://example.com/ubuntu.png',
        basedOn: null,
        isPopular: true,
        themeColorLight: '#E95420',
        themeColorDark: '#77216F',
        distroSources: [
          {
            sourceId: 'source-1',
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
            },
          },
          {
            sourceId: 'source-2',
            priority: 5,
            isDefault: false,
            source: {
              id: 'source-2',
              name: 'Flatpak',
              slug: 'flatpak',
            },
          },
        ],
      });
    });

    it('should apply default values for nullable fields', async () => {
      const distroWithNulls = {
        ...mockDistroWithSources,
        isPopular: null,
        themeColorLight: null,
        themeColorDark: null,
        distroSources: [
          {
            distroId: 'distro-1',
            sourceId: 'source-1',
            priority: null,
            isDefault: null,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
            },
          },
        ],
      };
      (db.query.distros.findMany as Mock).mockResolvedValue([distroWithNulls]);

      const result = await distrosRepository.findAllWithSourcesNormalized();

      expect(result[0].isPopular).toBe(false);
      expect(result[0].themeColorLight).toBeNull();
      expect(result[0].themeColorDark).toBeNull();
      expect(result[0].distroSources[0].priority).toBe(0);
      expect(result[0].distroSources[0].isDefault).toBe(false);
    });

    it('should return empty array when no distros exist', async () => {
      (db.query.distros.findMany as Mock).mockResolvedValue([]);

      const result = await distrosRepository.findAllWithSourcesNormalized();

      expect(result).toEqual([]);
    });

    it('should handle distro with no sources', async () => {
      const distroNoSources = {
        ...mockDistroWithSources,
        distroSources: [],
      };
      (db.query.distros.findMany as Mock).mockResolvedValue([distroNoSources]);

      const result = await distrosRepository.findAllWithSourcesNormalized();

      expect(result[0].distroSources).toEqual([]);
    });

    it('should normalize multiple distros correctly', async () => {
      const multipleDistros = [
        mockDistroWithSources,
        {
          ...mockDistroWithSources,
          id: 'distro-2',
          name: 'Fedora',
          slug: 'fedora',
          family: 'rhel',
        },
      ];
      (db.query.distros.findMany as Mock).mockResolvedValue(multipleDistros);

      const result = await distrosRepository.findAllWithSourcesNormalized();

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('ubuntu');
      expect(result[1].slug).toBe('fedora');
    });
  });

  describe('findBySlug', () => {
    it('should find distro by slug', async () => {
      (db.query.distros.findFirst as Mock).mockResolvedValue(mockDistro);

      const result = await distrosRepository.findBySlug('ubuntu');

      expect(result).toEqual(mockDistro);
      expect(db.query.distros.findFirst).toHaveBeenCalled();
    });

    it('should return undefined when distro not found', async () => {
      (db.query.distros.findFirst as Mock).mockResolvedValue(undefined);

      const result = await distrosRepository.findBySlug('non-existent');

      expect(result).toBeUndefined();
    });

    it('should handle various slug formats', async () => {
      (db.query.distros.findFirst as Mock).mockResolvedValue(mockDistro);

      await distrosRepository.findBySlug('linux-mint');
      await distrosRepository.findBySlug('pop_os');
      await distrosRepository.findBySlug('arch');

      expect(db.query.distros.findFirst).toHaveBeenCalledTimes(3);
    });
  });

  describe('findBySlugWithSources', () => {
    it('should find distro by slug with normalized sources', async () => {
      (db.query.distros.findFirst as Mock).mockResolvedValue(mockDistroWithSources);

      const result = await distrosRepository.findBySlugWithSources('ubuntu');

      expect(result).toEqual({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        iconUrl: 'https://example.com/ubuntu.png',
        basedOn: null,
        isPopular: true,
        themeColorLight: '#E95420',
        themeColorDark: '#77216F',
        distroSources: [
          {
            sourceId: 'source-1',
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
            },
          },
          {
            sourceId: 'source-2',
            priority: 5,
            isDefault: false,
            source: {
              id: 'source-2',
              name: 'Flatpak',
              slug: 'flatpak',
            },
          },
        ],
      });
    });

    it('should return undefined when distro not found', async () => {
      (db.query.distros.findFirst as Mock).mockResolvedValue(undefined);

      const result = await distrosRepository.findBySlugWithSources('non-existent');

      expect(result).toBeUndefined();
    });

    it('should return undefined when distro is null', async () => {
      (db.query.distros.findFirst as Mock).mockResolvedValue(null);

      const result = await distrosRepository.findBySlugWithSources('non-existent');

      expect(result).toBeUndefined();
    });

    it('should apply default values for nullable fields', async () => {
      const distroWithNulls = {
        ...mockDistroWithSources,
        isPopular: null,
        themeColorLight: null,
        themeColorDark: null,
        distroSources: [
          {
            distroId: 'distro-1',
            sourceId: 'source-1',
            priority: null,
            isDefault: null,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
            },
          },
        ],
      };
      (db.query.distros.findFirst as Mock).mockResolvedValue(distroWithNulls);

      const result = await distrosRepository.findBySlugWithSources('ubuntu');

      expect(result?.isPopular).toBe(false);
      expect(result?.themeColorLight).toBeNull();
      expect(result?.themeColorDark).toBeNull();
      expect(result?.distroSources[0].priority).toBe(0);
      expect(result?.distroSources[0].isDefault).toBe(false);
    });

    it('should handle distro with empty sources array', async () => {
      const distroNoSources = {
        ...mockDistroWithSources,
        distroSources: [],
      };
      (db.query.distros.findFirst as Mock).mockResolvedValue(distroNoSources);

      const result = await distrosRepository.findBySlugWithSources('ubuntu');

      expect(result?.distroSources).toEqual([]);
    });
  });

  describe('findPopular', () => {
    it('should find only popular distros', async () => {
      const popularDistros = [
        { ...mockDistro, isPopular: true },
        { ...mockDistro, id: 'distro-2', name: 'Fedora', isPopular: true },
      ];
      (db.query.distros.findMany as Mock).mockResolvedValue(popularDistros);

      const result = await distrosRepository.findPopular();

      expect(result).toHaveLength(2);
      expect(result.every((d) => d.isPopular)).toBe(true);
    });

    it('should return empty array when no popular distros', async () => {
      (db.query.distros.findMany as Mock).mockResolvedValue([]);

      const result = await distrosRepository.findPopular();

      expect(result).toEqual([]);
    });

    it('should order popular distros by name', async () => {
      const popularDistros = [
        { ...mockDistro, id: 'distro-1', name: 'Ubuntu' },
        { ...mockDistro, id: 'distro-2', name: 'Arch' },
        { ...mockDistro, id: 'distro-3', name: 'Fedora' },
      ];
      (db.query.distros.findMany as Mock).mockResolvedValue(popularDistros);

      const result = await distrosRepository.findPopular();

      expect(result).toHaveLength(3);
      expect(db.query.distros.findMany).toHaveBeenCalled();
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(distrosRepository).toBeDefined();
      expect(typeof distrosRepository.findAllOrdered).toBe('function');
      expect(typeof distrosRepository.findAllWithSourcesNormalized).toBe('function');
      expect(typeof distrosRepository.findBySlug).toBe('function');
      expect(typeof distrosRepository.findBySlugWithSources).toBe('function');
      expect(typeof distrosRepository.findPopular).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle distro with null iconUrl', async () => {
      const distroNullIcon = {
        ...mockDistroWithSources,
        iconUrl: null,
      };
      (db.query.distros.findFirst as Mock).mockResolvedValue(distroNullIcon);

      const result = await distrosRepository.findBySlugWithSources('ubuntu');

      expect(result?.iconUrl).toBeNull();
    });

    it('should handle distro with basedOn field', async () => {
      const distroWithBasedOn = {
        ...mockDistroWithSources,
        basedOn: 'debian',
      };
      (db.query.distros.findFirst as Mock).mockResolvedValue(distroWithBasedOn);

      const result = await distrosRepository.findBySlugWithSources('ubuntu');

      expect(result?.basedOn).toBe('debian');
    });

    it('should handle distro with many sources', async () => {
      const manySourcesDistro = {
        ...mockDistroWithSources,
        distroSources: [
          {
            distroId: 'distro-1',
            sourceId: 'source-1',
            priority: 10,
            isDefault: true,
            source: { id: 'source-1', name: 'APT', slug: 'apt' },
          },
          {
            distroId: 'distro-1',
            sourceId: 'source-2',
            priority: 8,
            isDefault: false,
            source: { id: 'source-2', name: 'Flatpak', slug: 'flatpak' },
          },
          {
            distroId: 'distro-1',
            sourceId: 'source-3',
            priority: 6,
            isDefault: false,
            source: { id: 'source-3', name: 'Snap', slug: 'snap' },
          },
          {
            distroId: 'distro-1',
            sourceId: 'source-4',
            priority: 4,
            isDefault: false,
            source: { id: 'source-4', name: 'AppImage', slug: 'appimage' },
          },
        ],
      };
      (db.query.distros.findFirst as Mock).mockResolvedValue(manySourcesDistro);

      const result = await distrosRepository.findBySlugWithSources('ubuntu');

      expect(result?.distroSources).toHaveLength(4);
    });
  });
});
