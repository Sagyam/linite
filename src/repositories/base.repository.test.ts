import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { BaseRepository, type FindOptions } from './base.repository';
import type { SQL } from 'drizzle-orm';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    query: {
      testTable: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value, type: 'eq' })),
  count: vi.fn(() => ({ fn: 'count' })),
}));

import { db } from '@/db';
import { eq, count } from 'drizzle-orm';

// Test type
interface TestEntity {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

describe('BaseRepository', () => {
  // Mock table
  const mockTable = {
    id: 'id',
    name: 'name',
    description: 'description',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  };

  let repository: BaseRepository<TestEntity>;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new BaseRepository<TestEntity>(mockTable, 'testTable');
  });

  describe('findMany', () => {
    it('should find all records without options', async () => {
      const mockData: TestEntity[] = [
        {
          id: '1',
          name: 'Test 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Test 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (db.query.testTable.findMany as Mock).mockResolvedValue(mockData);

      const result = await repository.findMany();

      expect(result).toEqual(mockData);
      expect(db.query.testTable.findMany).toHaveBeenCalledWith({
        where: undefined,
        limit: undefined,
        offset: undefined,
        orderBy: undefined,
        with: undefined,
      });
    });

    it('should find records with limit and offset', async () => {
      const mockData: TestEntity[] = [
        { id: '3', name: 'Test 3', createdAt: new Date(), updatedAt: new Date() },
      ];

      (db.query.testTable.findMany as Mock).mockResolvedValue(mockData);

      const options: FindOptions<TestEntity> = {
        limit: 10,
        offset: 20,
      };

      const result = await repository.findMany(options);

      expect(result).toEqual(mockData);
      expect(db.query.testTable.findMany).toHaveBeenCalledWith({
        where: undefined,
        limit: 10,
        offset: 20,
        orderBy: undefined,
        with: undefined,
      });
    });

    it('should find records with where condition', async () => {
      const mockData: TestEntity[] = [];
      const whereCondition = { type: 'eq', column: 'name', value: 'Test' } as unknown as SQL;

      (db.query.testTable.findMany as Mock).mockResolvedValue(mockData);

      const options: FindOptions<TestEntity> = {
        where: whereCondition,
      };

      const result = await repository.findMany(options);

      expect(result).toEqual(mockData);
      expect(db.query.testTable.findMany).toHaveBeenCalledWith({
        where: whereCondition,
        limit: undefined,
        offset: undefined,
        orderBy: undefined,
        with: undefined,
      });
    });

    it('should find records with relations', async () => {
      const mockData: TestEntity[] = [];
      const withRelations = { category: true };

      (db.query.testTable.findMany as Mock).mockResolvedValue(mockData);

      const options: FindOptions<TestEntity> = {
        with: withRelations,
      };

      const result = await repository.findMany(options);

      expect(result).toEqual(mockData);
      expect(db.query.testTable.findMany).toHaveBeenCalledWith({
        where: undefined,
        limit: undefined,
        offset: undefined,
        orderBy: undefined,
        with: withRelations,
      });
    });

    it('should find records with all options combined', async () => {
      const mockData: TestEntity[] = [];
      const whereCondition = {} as SQL;
      const orderBy = { column: 'name', direction: 'asc' };
      const withRelations = { category: true };

      (db.query.testTable.findMany as Mock).mockResolvedValue(mockData);

      const options: FindOptions<TestEntity> = {
        where: whereCondition,
        limit: 5,
        offset: 10,
        orderBy,
        with: withRelations,
      };

      const result = await repository.findMany(options);

      expect(result).toEqual(mockData);
      expect(db.query.testTable.findMany).toHaveBeenCalledWith({
        where: whereCondition,
        limit: 5,
        offset: 10,
        orderBy,
        with: withRelations,
      });
    });

    it('should throw error if query interface not found', async () => {
      const invalidRepo = new BaseRepository<TestEntity>(mockTable, 'nonexistentTable');

      await expect(invalidRepo.findMany()).rejects.toThrow(
        'Query interface not found for table: nonexistentTable'
      );
    });
  });

  describe('findFirst', () => {
    it('should find first record with where condition', async () => {
      const mockData: TestEntity = {
        id: '1',
        name: 'Test 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const whereCondition = {} as SQL;

      (db.query.testTable.findFirst as Mock).mockResolvedValue(mockData);

      const result = await repository.findFirst({ where: whereCondition });

      expect(result).toEqual(mockData);
      expect(db.query.testTable.findFirst).toHaveBeenCalledWith({
        where: whereCondition,
        with: undefined,
      });
    });

    it('should return undefined when no record found', async () => {
      const whereCondition = {} as SQL;

      (db.query.testTable.findFirst as Mock).mockResolvedValue(undefined);

      const result = await repository.findFirst({ where: whereCondition });

      expect(result).toBeUndefined();
    });

    it('should find first record with relations', async () => {
      const mockData: TestEntity = {
        id: '1',
        name: 'Test 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const whereCondition = {} as SQL;
      const withRelations = { category: true };

      (db.query.testTable.findFirst as Mock).mockResolvedValue(mockData);

      const result = await repository.findFirst({
        where: whereCondition,
        with: withRelations,
      });

      expect(result).toEqual(mockData);
      expect(db.query.testTable.findFirst).toHaveBeenCalledWith({
        where: whereCondition,
        with: withRelations,
      });
    });

    it('should throw error if query interface not found', async () => {
      const invalidRepo = new BaseRepository<TestEntity>(mockTable, 'nonexistentTable');

      await expect(invalidRepo.findFirst({ where: {} as SQL })).rejects.toThrow(
        'Query interface not found for table: nonexistentTable'
      );
    });
  });

  describe('findById', () => {
    it('should find record by ID', async () => {
      const mockData: TestEntity = {
        id: 'test-123',
        name: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.testTable.findFirst as Mock).mockResolvedValue(mockData);

      const result = await repository.findById('test-123');

      expect(result).toEqual(mockData);
      expect(eq).toHaveBeenCalledWith(mockTable.id, 'test-123');
      expect(db.query.testTable.findFirst).toHaveBeenCalled();
    });

    it('should find record by ID with relations', async () => {
      const mockData: TestEntity = {
        id: 'test-123',
        name: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const withRelations = { category: true };

      (db.query.testTable.findFirst as Mock).mockResolvedValue(mockData);

      const result = await repository.findById('test-123', withRelations);

      expect(result).toEqual(mockData);
      expect(eq).toHaveBeenCalledWith(mockTable.id, 'test-123');
      expect(db.query.testTable.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
        with: withRelations,
      });
    });

    it('should return undefined when record not found', async () => {
      (db.query.testTable.findFirst as Mock).mockResolvedValue(undefined);

      const result = await repository.findById('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should throw error if query interface not found', async () => {
      const invalidRepo = new BaseRepository<TestEntity>(mockTable, 'nonexistentTable');

      await expect(invalidRepo.findById('test-123')).rejects.toThrow(
        'Query interface not found for table: nonexistentTable'
      );
    });
  });

  describe('count', () => {
    it('should count all records without where condition', async () => {
      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 42 }]),
        }),
      });

      (db.select as Mock) = selectMock;

      const result = await repository.count();

      expect(result).toBe(42);
      expect(count).toHaveBeenCalled();
      expect(selectMock).toHaveBeenCalled();
    });

    it('should count records with where condition', async () => {
      const whereCondition = {} as SQL;

      const whereMock = vi.fn().mockResolvedValue([{ count: 10 }]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      const selectMock = vi.fn().mockReturnValue({ from: fromMock });

      (db.select as Mock) = selectMock;

      const result = await repository.count(whereCondition);

      expect(result).toBe(10);
      expect(whereMock).toHaveBeenCalledWith(whereCondition);
    });

    it('should return 0 when count result is undefined', async () => {
      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      (db.select as Mock) = selectMock;

      const result = await repository.count();

      expect(result).toBe(0);
    });

    it('should handle null count result', async () => {
      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: null }]),
        }),
      });

      (db.select as Mock) = selectMock;

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const newData: Partial<TestEntity> = {
        name: 'New Test',
        description: 'Test description',
      };

      const createdRecord: TestEntity = {
        id: 'new-123',
        name: 'New Test',
        description: 'Test description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const returningMock = vi.fn().mockResolvedValue([createdRecord]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

      (db.insert as Mock) = insertMock;

      const result = await repository.create(newData);

      expect(result).toEqual(createdRecord);
      expect(insertMock).toHaveBeenCalledWith(mockTable);
      expect(valuesMock).toHaveBeenCalledWith(newData);
      expect(returningMock).toHaveBeenCalled();
    });

    it('should create record with minimal data', async () => {
      const minimalData: Partial<TestEntity> = {
        name: 'Minimal',
      };

      const createdRecord: TestEntity = {
        id: 'min-123',
        name: 'Minimal',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const returningMock = vi.fn().mockResolvedValue([createdRecord]);
      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({ returning: returningMock }),
      });

      const result = await repository.create(minimalData);

      expect(result).toEqual(createdRecord);
    });
  });

  describe('update', () => {
    it('should update a record by ID', async () => {
      const updateData: Partial<TestEntity> = {
        name: 'Updated Test',
        description: 'Updated description',
      };

      const updatedRecord: TestEntity = {
        id: 'update-123',
        name: 'Updated Test',
        description: 'Updated description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const returningMock = vi.fn().mockResolvedValue([updatedRecord]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      const updateMock = vi.fn().mockReturnValue({ set: setMock });

      (db.update as Mock) = updateMock;

      const result = await repository.update('update-123', updateData);

      expect(result).toEqual(updatedRecord);
      expect(updateMock).toHaveBeenCalledWith(mockTable);
      expect(setMock).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Date),
      });
      expect(eq).toHaveBeenCalledWith(mockTable.id, 'update-123');
      expect(whereMock).toHaveBeenCalled();
    });

    it('should return undefined when record not found', async () => {
      const updateData: Partial<TestEntity> = {
        name: 'Updated',
      };

      const returningMock = vi.fn().mockResolvedValue([]);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning: returningMock }),
        }),
      });

      const result = await repository.update('nonexistent', updateData);

      expect(result).toBeUndefined();
    });

    it('should automatically set updatedAt timestamp', async () => {
      const updateData: Partial<TestEntity> = {
        name: 'Updated',
      };

      const updatedRecord: TestEntity = {
        id: 'test-123',
        name: 'Updated',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const returningMock = vi.fn().mockResolvedValue([updatedRecord]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });

      (db.update as Mock).mockReturnValue({ set: setMock });

      await repository.update('test-123', updateData);

      expect(setMock).toHaveBeenCalledWith({
        name: 'Updated',
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('delete', () => {
    it('should delete a record by ID and return true', async () => {
      const deletedRecord: TestEntity = {
        id: 'delete-123',
        name: 'Deleted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const returningMock = vi.fn().mockResolvedValue([deletedRecord]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const deleteMock = vi.fn().mockReturnValue({ where: whereMock });

      (db.delete as Mock) = deleteMock;

      const result = await repository.delete('delete-123');

      expect(result).toBe(true);
      expect(deleteMock).toHaveBeenCalledWith(mockTable);
      expect(eq).toHaveBeenCalledWith(mockTable.id, 'delete-123');
      expect(whereMock).toHaveBeenCalled();
    });

    it('should return false when record not found', async () => {
      const returningMock = vi.fn().mockResolvedValue([]);
      (db.delete as Mock).mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: returningMock }),
      });

      const result = await repository.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when record exists', async () => {
      const whereCondition = {} as SQL;

      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      (db.select as Mock) = selectMock;

      const result = await repository.exists(whereCondition);

      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      const whereCondition = {} as SQL;

      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      (db.select as Mock) = selectMock;

      const result = await repository.exists(whereCondition);

      expect(result).toBe(false);
    });

    it('should return true when multiple records exist', async () => {
      const whereCondition = {} as SQL;

      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      (db.select as Mock) = selectMock;

      const result = await repository.exists(whereCondition);

      expect(result).toBe(true);
    });
  });

  describe('findPaginated', () => {
    it('should return paginated results with hasMore=true', async () => {
      const mockData: TestEntity[] = [
        { id: '1', name: 'Test 1', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Test 2', createdAt: new Date(), updatedAt: new Date() },
      ];

      // Mock findMany
      (db.query.testTable.findMany as Mock).mockResolvedValue(mockData);

      // Mock count
      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 100 }]),
        }),
      });
      (db.select as Mock) = selectMock;

      const options: FindOptions<TestEntity> = {
        limit: 10,
        offset: 0,
      };

      const result = await repository.findPaginated(options);

      expect(result).toEqual({
        data: mockData,
        total: 100,
        hasMore: true, // 0 + 10 < 100
      });
    });

    it('should return paginated results with hasMore=false', async () => {
      const mockData: TestEntity[] = [
        { id: '1', name: 'Test 1', createdAt: new Date(), updatedAt: new Date() },
      ];

      (db.query.testTable.findMany as Mock).mockResolvedValue(mockData);

      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });
      (db.select as Mock) = selectMock;

      const options: FindOptions<TestEntity> = {
        limit: 10,
        offset: 0,
      };

      const result = await repository.findPaginated(options);

      expect(result).toEqual({
        data: mockData,
        total: 5,
        hasMore: false, // 0 + 10 >= 5
      });
    });

    it('should use default limit and offset', async () => {
      const mockData: TestEntity[] = [];

      (db.query.testTable.findMany as Mock).mockResolvedValue(mockData);

      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });
      (db.select as Mock) = selectMock;

      const result = await repository.findPaginated({});

      expect(result).toEqual({
        data: mockData,
        total: 0,
        hasMore: false,
      });

      expect(db.query.testTable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: undefined,
          offset: undefined,
        })
      );
    });

    it('should respect where condition in both data and count queries', async () => {
      const whereCondition = {} as SQL;
      const mockData: TestEntity[] = [];

      (db.query.testTable.findMany as Mock).mockResolvedValue(mockData);

      const whereMock = vi.fn().mockResolvedValue([{ count: 25 }]);
      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({ where: whereMock }),
      });
      (db.select as Mock) = selectMock;

      const options: FindOptions<TestEntity> = {
        where: whereCondition,
        limit: 10,
        offset: 20,
      };

      const result = await repository.findPaginated(options);

      expect(db.query.testTable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: whereCondition,
        })
      );
      expect(whereMock).toHaveBeenCalledWith(whereCondition);
      expect(result.hasMore).toBe(false); // 20 + 10 >= 25
    });

    it('should calculate hasMore correctly at page boundary', async () => {
      const mockData: TestEntity[] = [];

      (db.query.testTable.findMany as Mock).mockResolvedValue(mockData);

      const selectMock = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 100 }]),
        }),
      });
      (db.select as Mock) = selectMock;

      const options: FindOptions<TestEntity> = {
        limit: 10,
        offset: 90,
      };

      const result = await repository.findPaginated(options);

      expect(result.hasMore).toBe(false); // 90 + 10 = 100, not less than 100
    });

    it('should execute findMany and count in parallel', async () => {
      const mockData: TestEntity[] = [];
      const findManyPromise = Promise.resolve(mockData);
      const countPromise = Promise.resolve([{ count: 10 }]);

      (db.query.testTable.findMany as Mock).mockReturnValue(findManyPromise);
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(countPromise),
        }),
      });

      // Spy on Promise.all to verify parallel execution
      const promiseAllSpy = vi.spyOn(Promise, 'all');

      await repository.findPaginated({});

      expect(promiseAllSpy).toHaveBeenCalled();
    });
  });
});
