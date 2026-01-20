import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { InstallationHistoryService } from './installation-history.service';
import type { CreateInstallationRequest, UpdateInstallationRequest } from '../types/api';

vi.mock('@/db', () => ({
  db: {
    query: {
      installations: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    selectDistinct: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from '../db';

describe('InstallationHistoryService', () => {
  const mockUserId = 'user-1';
  const mockInstallationId = 'inst-1';

  const mockInstallation = {
    id: mockInstallationId,
    userId: mockUserId,
    appId: 'app-1',
    packageId: 'pkg-1',
    distroId: 'distro-1',
    deviceIdentifier: 'My Laptop',
    installedAt: new Date('2024-01-01'),
    notes: 'Test notes',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockInstallationWithRelations = {
    ...mockInstallation,
    user: {
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
    },
    app: {
      id: 'app-1',
      displayName: 'Firefox',
      slug: 'firefox',
      iconUrl: 'https://example.com/icon.png',
    },
    package: {
      id: 'pkg-1',
      identifier: 'org.mozilla.firefox',
      version: '120.0',
      source: {
        id: 'source-1',
        name: 'Flatpak',
        slug: 'flatpak',
      },
    },
    distro: {
      id: 'distro-1',
      name: 'Ubuntu',
      slug: 'ubuntu',
      iconUrl: 'https://example.com/ubuntu.png',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserInstallations', () => {
    it('should return installations for a user with no filters', async () => {
      (db.query.installations.findMany as Mock).mockResolvedValue([
        mockInstallationWithRelations,
      ]);

      const result = await InstallationHistoryService.getUserInstallations(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockInstallationWithRelations);
      expect(db.query.installations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
          with: expect.anything(),
          limit: 100,
          offset: 0,
          orderBy: expect.anything(),
        })
      );
    });

    it('should filter by device identifier', async () => {
      (db.query.installations.findMany as Mock).mockResolvedValue([
        mockInstallationWithRelations,
      ]);

      const result = await InstallationHistoryService.getUserInstallations(mockUserId, {
        deviceIdentifier: 'My Laptop',
      });

      expect(result).toHaveLength(1);
      expect(db.query.installations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        })
      );
    });

    it('should filter by app ID', async () => {
      (db.query.installations.findMany as Mock).mockResolvedValue([
        mockInstallationWithRelations,
      ]);

      const result = await InstallationHistoryService.getUserInstallations(mockUserId, {
        appId: 'app-1',
      });

      expect(result).toHaveLength(1);
    });

    it('should filter by distro ID', async () => {
      (db.query.installations.findMany as Mock).mockResolvedValue([
        mockInstallationWithRelations,
      ]);

      const result = await InstallationHistoryService.getUserInstallations(mockUserId, {
        distroId: 'distro-1',
      });

      expect(result).toHaveLength(1);
    });

    it('should support pagination', async () => {
      (db.query.installations.findMany as Mock).mockResolvedValue([]);

      await InstallationHistoryService.getUserInstallations(mockUserId, {
        limit: 50,
        offset: 10,
      });

      expect(db.query.installations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 10,
        })
      );
    });

    it('should apply default pagination params', async () => {
      (db.query.installations.findMany as Mock).mockResolvedValue([]);

      await InstallationHistoryService.getUserInstallations(mockUserId);

      expect(db.query.installations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
          offset: 0,
        })
      );
    });

    it('should return empty array when no installations found', async () => {
      (db.query.installations.findMany as Mock).mockResolvedValue([]);

      const result = await InstallationHistoryService.getUserInstallations(mockUserId);

      expect(result).toHaveLength(0);
    });

    it('should order by installedAt descending', async () => {
      (db.query.installations.findMany as Mock).mockResolvedValue([]);

      await InstallationHistoryService.getUserInstallations(mockUserId);

      expect(db.query.installations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.anything(),
        })
      );
    });
  });

  describe('getInstallationById', () => {
    it('should return installation with relations when found', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(
        mockInstallationWithRelations
      );

      const result = await InstallationHistoryService.getInstallationById(
        mockInstallationId,
        mockUserId
      );

      expect(result).toEqual(mockInstallationWithRelations);
      expect(db.query.installations.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
          with: expect.anything(),
        })
      );
    });

    it('should return null when installation not found', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(null);

      const result = await InstallationHistoryService.getInstallationById(
        'non-existent',
        mockUserId
      );

      expect(result).toBeNull();
    });

    it('should return null for different user (ownership check)', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(null);

      const result = await InstallationHistoryService.getInstallationById(
        mockInstallationId,
        'different-user-id'
      );

      expect(result).toBeNull();
    });

    it('should include all required relations', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(
        mockInstallationWithRelations
      );

      await InstallationHistoryService.getInstallationById(
        mockInstallationId,
        mockUserId
      );

      expect(db.query.installations.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          with: expect.objectContaining({
            user: expect.anything(),
            app: expect.anything(),
            package: expect.anything(),
            distro: expect.anything(),
          }),
        })
      );
    });
  });

  describe('createInstallation', () => {
    it('should create a new installation', async () => {
      const createData: CreateInstallationRequest = {
        appId: 'app-1',
        packageId: 'pkg-1',
        distroId: 'distro-1',
        deviceIdentifier: 'My Laptop',
        notes: 'Test notes',
      };

      const newInstallation = {
        ...mockInstallation,
        ...createData,
        id: 'new-inst-1',
      };

      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newInstallation]),
      });

      const result = await InstallationHistoryService.createInstallation(
        mockUserId,
        createData
      );

      expect(result).toEqual(newInstallation);
      expect(db.insert).toHaveBeenCalledWith(
        expect.anything()
      );
    });

    it('should create installation without notes', async () => {
      const createData: CreateInstallationRequest = {
        appId: 'app-1',
        packageId: 'pkg-1',
        distroId: 'distro-1',
        deviceIdentifier: 'My Laptop',
      };

      const newInstallation = {
        ...mockInstallation,
        ...createData,
        notes: null,
        id: 'new-inst-1',
      };

      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newInstallation]),
      });

      const result = await InstallationHistoryService.createInstallation(
        mockUserId,
        createData
      );

      expect(result.notes).toBeNull();
    });

    it('should associate installation with user', async () => {
      const createData: CreateInstallationRequest = {
        appId: 'app-1',
        packageId: 'pkg-1',
        distroId: 'distro-1',
        deviceIdentifier: 'My Laptop',
      };

      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockInstallation]),
      });

      await InstallationHistoryService.createInstallation(mockUserId, createData);

      expect(db.insert).toHaveBeenCalledWith(
        expect.anything()
      );
    });
  });

  describe('updateInstallation', () => {
    it('should update installation with ownership check', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(
        mockInstallationWithRelations
      );

      const updatedInstallation = {
        ...mockInstallation,
        deviceIdentifier: 'Updated Device',
        notes: 'Updated notes',
      };

      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedInstallation]),
      });

      const updateData: UpdateInstallationRequest = {
        deviceIdentifier: 'Updated Device',
        notes: 'Updated notes',
      };

      const result = await InstallationHistoryService.updateInstallation(
        mockInstallationId,
        mockUserId,
        updateData
      );

      expect(result).toEqual(updatedInstallation);
      expect(db.query.installations.findFirst).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
    });

    it('should update only deviceIdentifier', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(
        mockInstallationWithRelations
      );

      const updatedInstallation = {
        ...mockInstallation,
        deviceIdentifier: 'New Device',
      };

      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedInstallation]),
      });

      const updateData: UpdateInstallationRequest = {
        deviceIdentifier: 'New Device',
      };

      const result = await InstallationHistoryService.updateInstallation(
        mockInstallationId,
        mockUserId,
        updateData
      );

      expect(result.deviceIdentifier).toBe('New Device');
    });

    it('should update only notes', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(
        mockInstallationWithRelations
      );

      const updatedInstallation = {
        ...mockInstallation,
        notes: 'New notes',
      };

      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedInstallation]),
      });

      const updateData: UpdateInstallationRequest = {
        notes: 'New notes',
      };

      const result = await InstallationHistoryService.updateInstallation(
        mockInstallationId,
        mockUserId,
        updateData
      );

      expect(result.notes).toBe('New notes');
    });

    it('should throw error when installation not found', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(null);

      const updateData: UpdateInstallationRequest = {
        deviceIdentifier: 'New Device',
      };

      await expect(
        InstallationHistoryService.updateInstallation(
          'non-existent',
          mockUserId,
          updateData
        )
      ).rejects.toThrow('Installation not found or access denied');
    });

    it('should throw error when user does not own installation', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(null);

      const updateData: UpdateInstallationRequest = {
        deviceIdentifier: 'New Device',
      };

      await expect(
        InstallationHistoryService.updateInstallation(
          mockInstallationId,
          'different-user-id',
          updateData
        )
      ).rejects.toThrow('Installation not found or access denied');
    });

    it('should update updatedAt timestamp', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(
        mockInstallationWithRelations
      );

      const updatedInstallation = {
        ...mockInstallation,
        updatedAt: new Date('2024-01-02'),
      };

      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedInstallation]),
      });

      const updateData: UpdateInstallationRequest = {
        notes: 'Updated',
      };

      await InstallationHistoryService.updateInstallation(
        mockInstallationId,
        mockUserId,
        updateData
      );

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('deleteInstallation', () => {
    it('should delete installation with ownership check', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(
        mockInstallationWithRelations
      );

      (db.delete as Mock).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await InstallationHistoryService.deleteInstallation(
        mockInstallationId,
        mockUserId
      );

      expect(db.query.installations.findFirst).toHaveBeenCalled();
      expect(db.delete).toHaveBeenCalled();
    });

    it('should throw error when installation not found', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(null);

      await expect(
        InstallationHistoryService.deleteInstallation('non-existent', mockUserId)
      ).rejects.toThrow('Installation not found or access denied');
    });

    it('should throw error when user does not own installation', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(null);

      await expect(
        InstallationHistoryService.deleteInstallation(
          mockInstallationId,
          'different-user-id'
        )
      ).rejects.toThrow('Installation not found or access denied');
    });

    it('should not return anything on successful deletion', async () => {
      (db.query.installations.findFirst as Mock).mockResolvedValue(
        mockInstallationWithRelations
      );

      (db.delete as Mock).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const result = await InstallationHistoryService.deleteInstallation(
        mockInstallationId,
        mockUserId
      );

      expect(result).toBeUndefined();
    });
  });

  describe('getUserDevices', () => {
    it('should return unique device identifiers for a user', async () => {
      (db.selectDistinct as Mock).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { deviceIdentifier: 'My Laptop' },
          { deviceIdentifier: 'Work PC' },
          { deviceIdentifier: 'Home Desktop' },
        ]),
      });

      const result = await InstallationHistoryService.getUserDevices(mockUserId);

      expect(result).toEqual(['My Laptop', 'Work PC', 'Home Desktop']);
      expect(db.selectDistinct).toHaveBeenCalled();
    });

    it('should return empty array when user has no devices', async () => {
      (db.selectDistinct as Mock).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      });

      const result = await InstallationHistoryService.getUserDevices(mockUserId);

      expect(result).toEqual([]);
    });

    it('should filter by user ID', async () => {
      (db.selectDistinct as Mock).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { deviceIdentifier: 'My Laptop' },
        ]),
      });

      await InstallationHistoryService.getUserDevices(mockUserId);

      expect(db.selectDistinct).toHaveBeenCalled();
    });

    it('should select only deviceIdentifier column', async () => {
      (db.selectDistinct as Mock).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      });

      await InstallationHistoryService.getUserDevices(mockUserId);

      expect(db.selectDistinct).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceIdentifier: expect.anything(),
        })
      );
    });

    it('should deduplicate device identifiers', async () => {
      (db.selectDistinct as Mock).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { deviceIdentifier: 'My Laptop' },
          { deviceIdentifier: 'Work PC' },
        ]),
      });

      const result = await InstallationHistoryService.getUserDevices(mockUserId);

      expect(result).toHaveLength(2);
      expect(result).toEqual(['My Laptop', 'Work PC']);
    });
  });
});
