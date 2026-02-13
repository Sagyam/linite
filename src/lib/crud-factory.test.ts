import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { z } from 'zod';

// Mock dependencies BEFORE imports
vi.mock('@/db', () => ({
  db: {
    query: {
      testTable: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value, type: 'eq' })),
}));

vi.mock('./api-middleware', () => ({
  createPublicApiHandler: vi.fn((handler) => handler),
  createAuthApiHandler: vi.fn((handler) => handler),
  createAuthValidatedApiHandler: vi.fn((_schema, handler) => async (request: any, context: any) => {
    const body = request.body;
    return handler(request, body, context);
  }),
}));

vi.mock('./api-utils', () => ({
  errorResponse: vi.fn((message, status) => ({
    type: 'error',
    message,
    status,
  })),
  successResponse: vi.fn((data, status = 200) => ({
    type: 'success',
    data,
    status,
  })),
}));

import { createCRUDHandlers, type CRUDConfig } from './crud-factory';
import { errorResponse, successResponse } from './api-utils';
import { createPublicApiHandler, createAuthApiHandler } from './api-middleware';
import { db } from '@/db';

// Get mock references after import
const mockDbQueryFindFirst = (db.query as any).testTable.findFirst as Mock;
const mockDbUpdate = (db as any).update as Mock;
const mockDbDelete = (db as any).delete as Mock;

describe('createCRUDHandlers', () => {
  const testSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
  });

  const defaultConfig: CRUDConfig<z.infer<typeof testSchema>> = {
    table: { id: 'test-table' },
    tableName: 'testTable',
    updateSchema: testSchema,
  };

  const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQueryFindFirst.mockReset();
    mockDbUpdate.mockReset();
    mockDbDelete.mockReset();
  });

  describe('factory function', () => {
    it('should return GET, PUT, and DELETE handlers', () => {
      const handlers = createCRUDHandlers(defaultConfig);

      expect(handlers).toHaveProperty('GET');
      expect(handlers).toHaveProperty('PUT');
      expect(handlers).toHaveProperty('DELETE');
    });

    it('should use default entity name from tableName', () => {
      createCRUDHandlers(defaultConfig);

      // Verify createPublicApiHandler was called (default for GET)
      expect(createPublicApiHandler).toHaveBeenCalled();
    });

    it('should use custom entity name when provided', () => {
      createCRUDHandlers({
        ...defaultConfig,
        entityName: 'CustomEntity',
      });

      expect(createPublicApiHandler).toHaveBeenCalled();
    });

    it('should use createAuthApiHandler for GET when requireAuthForGet is true', () => {
      createCRUDHandlers({
        ...defaultConfig,
        requireAuthForGet: true,
      });

      expect(createAuthApiHandler).toHaveBeenCalled();
    });
  });

  describe('GET handler', () => {
    it('should return record when found', async () => {
      const mockRecord = { id: 'test-1', name: 'Test Record' };
      mockDbQueryFindFirst.mockResolvedValueOnce(mockRecord);

      const handlers = createCRUDHandlers(defaultConfig);
      const result = await handlers.GET({} as any, createContext('test-1'));

      expect(mockDbQueryFindFirst).toHaveBeenCalled();
      expect(successResponse).toHaveBeenCalledWith(mockRecord);
    });

    it('should return 404 when record not found', async () => {
      mockDbQueryFindFirst.mockResolvedValueOnce(null);

      const handlers = createCRUDHandlers(defaultConfig);
      await handlers.GET({} as any, createContext('nonexistent'));

      expect(errorResponse).toHaveBeenCalledWith('TestTable not found', 404);
    });

    it('should include relations when configured', async () => {
      const mockRecord = { id: 'test-1', apps: [] };
      mockDbQueryFindFirst.mockResolvedValueOnce(mockRecord);

      const handlers = createCRUDHandlers({
        ...defaultConfig,
        withRelations: { apps: true },
      });

      await handlers.GET({} as any, createContext('test-1'));

      expect(mockDbQueryFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          with: { apps: true },
        })
      );
    });

    it('should use custom entity name in error message', async () => {
      mockDbQueryFindFirst.mockResolvedValueOnce(null);

      const handlers = createCRUDHandlers({
        ...defaultConfig,
        entityName: 'Category',
      });

      await handlers.GET({} as any, createContext('nonexistent'));

      expect(errorResponse).toHaveBeenCalledWith('Category not found', 404);
    });
  });

  describe('PUT handler', () => {
    it('should update record successfully', async () => {
      const updatedRecord = { id: 'test-1', name: 'Updated', updatedAt: expect.any(Date) };
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedRecord]),
          }),
        }),
      });

      const handlers = createCRUDHandlers(defaultConfig);
      const request = { body: { id: 'test-1', name: 'Updated' } };

      await handlers.PUT(request as any, createContext('test-1'));

      expect(successResponse).toHaveBeenCalledWith(updatedRecord);
    });

    it('should return 400 when ID mismatch', async () => {
      const handlers = createCRUDHandlers(defaultConfig);
      const request = { body: { id: 'different-id', name: 'Updated' } };

      await handlers.PUT(request as any, createContext('test-1'));

      expect(errorResponse).toHaveBeenCalledWith('ID in body must match ID in URL', 400);
    });

    it('should return 404 when record not found on update', async () => {
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const handlers = createCRUDHandlers(defaultConfig);
      const request = { body: { id: 'nonexistent', name: 'Updated' } };

      await handlers.PUT(request as any, createContext('nonexistent'));

      expect(errorResponse).toHaveBeenCalledWith('TestTable not found', 404);
    });

    it('should convert empty string to null', async () => {
      const updatedRecord = { id: 'test-1', description: null };
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedRecord]),
        }),
      });
      mockDbUpdate.mockReturnValue({ set: setMock });

      const handlers = createCRUDHandlers(defaultConfig);
      const request = { body: { id: 'test-1', description: '' } };

      await handlers.PUT(request as any, createContext('test-1'));

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
        })
      );
    });

    it('should always set updatedAt timestamp', async () => {
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'test-1' }]),
        }),
      });
      mockDbUpdate.mockReturnValue({ set: setMock });

      const handlers = createCRUDHandlers(defaultConfig);
      const request = { body: { id: 'test-1', name: 'Test' } };

      await handlers.PUT(request as any, createContext('test-1'));

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should use custom update logic when provided', async () => {
      const customUpdateResult = { id: 'test-1', custom: true };
      const customUpdate = vi.fn().mockResolvedValue(customUpdateResult);

      const handlers = createCRUDHandlers({
        ...defaultConfig,
        customUpdate,
      });

      const request = { body: { id: 'test-1', name: 'Updated' } };
      await handlers.PUT(request as any, createContext('test-1'));

      expect(customUpdate).toHaveBeenCalledWith({ id: 'test-1', name: 'Updated' }, 'test-1');
      expect(successResponse).toHaveBeenCalledWith(customUpdateResult);
    });

    it('should return 404 when custom update returns null', async () => {
      const customUpdate = vi.fn().mockResolvedValue(null);

      const handlers = createCRUDHandlers({
        ...defaultConfig,
        customUpdate,
      });

      const request = { body: { id: 'test-1', name: 'Updated' } };
      await handlers.PUT(request as any, createContext('test-1'));

      expect(errorResponse).toHaveBeenCalledWith('TestTable not found', 404);
    });
  });

  describe('DELETE handler', () => {
    it('should delete record successfully', async () => {
      mockDbDelete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'test-1' }]),
        }),
      });

      const handlers = createCRUDHandlers(defaultConfig);
      await handlers.DELETE({} as any, createContext('test-1'));

      expect(successResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should return 404 when record not found on delete', async () => {
      mockDbDelete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      const handlers = createCRUDHandlers(defaultConfig);
      await handlers.DELETE({} as any, createContext('nonexistent'));

      expect(errorResponse).toHaveBeenCalledWith('TestTable not found', 404);
    });

    describe('beforeDelete hook', () => {
      it('should execute beforeDelete hook before deletion', async () => {
        const mockRecord = { id: 'test-1', apps: [] };
        mockDbQueryFindFirst.mockResolvedValueOnce(mockRecord);
        mockDbDelete.mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'test-1' }]),
          }),
        });

        const beforeDelete = vi.fn();
        const handlers = createCRUDHandlers({
          ...defaultConfig,
          beforeDelete,
        });

        await handlers.DELETE({} as any, createContext('test-1'));

        expect(beforeDelete).toHaveBeenCalledWith(mockRecord);
        expect(successResponse).toHaveBeenCalledWith({ success: true });
      });

      it('should return 400 when beforeDelete throws', async () => {
        const mockRecord = { id: 'test-1', apps: [{ id: 'app-1' }] };
        mockDbQueryFindFirst.mockResolvedValueOnce(mockRecord);

        const beforeDelete = vi.fn().mockImplementation(() => {
          throw new Error('Cannot delete record with associations');
        });

        const handlers = createCRUDHandlers({
          ...defaultConfig,
          beforeDelete,
        });

        await handlers.DELETE({} as any, createContext('test-1'));

        expect(errorResponse).toHaveBeenCalledWith('Cannot delete record with associations', 400);
      });

      it('should return 404 when record not found for beforeDelete check', async () => {
        mockDbQueryFindFirst.mockResolvedValueOnce(null);

        const beforeDelete = vi.fn();
        const handlers = createCRUDHandlers({
          ...defaultConfig,
          beforeDelete,
        });

        await handlers.DELETE({} as any, createContext('nonexistent'));

        expect(beforeDelete).not.toHaveBeenCalled();
        expect(errorResponse).toHaveBeenCalledWith('TestTable not found', 404);
      });

      it('should include relations when fetching for beforeDelete', async () => {
        const mockRecord = { id: 'test-1', apps: [] };
        mockDbQueryFindFirst.mockResolvedValueOnce(mockRecord);
        mockDbDelete.mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'test-1' }]),
          }),
        });

        const beforeDelete = vi.fn();
        const handlers = createCRUDHandlers({
          ...defaultConfig,
          withRelations: { apps: true },
          beforeDelete,
        });

        await handlers.DELETE({} as any, createContext('test-1'));

        expect(mockDbQueryFindFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            with: { apps: true },
          })
        );
      });

      it('should return generic validation failed message for non-Error throws', async () => {
        const mockRecord = { id: 'test-1' };
        mockDbQueryFindFirst.mockResolvedValueOnce(mockRecord);

        const beforeDelete = vi.fn().mockImplementation(() => {
          throw 'string error';
        });

        const handlers = createCRUDHandlers({
          ...defaultConfig,
          beforeDelete,
        });

        await handlers.DELETE({} as any, createContext('test-1'));

        expect(errorResponse).toHaveBeenCalledWith('Validation failed', 400);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should work with all configuration options', async () => {
      const mockRecord = { id: 'test-1', name: 'Test', apps: [] };
      mockDbQueryFindFirst.mockResolvedValueOnce(mockRecord);
      mockDbDelete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'test-1' }]),
        }),
      });

      const beforeDelete = vi.fn();
      const customUpdate = vi.fn().mockResolvedValue({ id: 'test-1', updated: true });

      const handlers = createCRUDHandlers({
        ...defaultConfig,
        entityName: 'TestEntity',
        withRelations: { apps: true },
        requireAuthForGet: true,
        beforeDelete,
        customUpdate,
      });

      // Test GET
      await handlers.GET({} as any, createContext('test-1'));
      expect(successResponse).toHaveBeenLastCalledWith(mockRecord);

      // Test PUT with custom update
      const request = { body: { id: 'test-1', name: 'Updated' } };
      await handlers.PUT(request as any, createContext('test-1'));
      expect(customUpdate).toHaveBeenCalled();

      // Reset mocks for DELETE test
      mockDbQueryFindFirst.mockResolvedValueOnce(mockRecord);

      // Test DELETE with beforeDelete
      await handlers.DELETE({} as any, createContext('test-1'));
      expect(beforeDelete).toHaveBeenCalledWith(mockRecord);
    });
  });
});
