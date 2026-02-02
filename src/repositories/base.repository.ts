import { db } from '@/db';
import type { SQL } from 'drizzle-orm';

/**
 * Base Repository Pattern
 * Provides generic CRUD operations for database entities
 */

export interface FindOptions {
  where?: SQL;
  limit?: number;
  offset?: number;
  orderBy?: unknown;
  with?: unknown;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any;

/**
 * Generic base repository class
 * Can be extended for entity-specific repositories
 */
export class BaseRepository<T> {
  constructor(
    protected table: AnyTable,
    protected tableName: string
  ) {}

  /**
   * Find all records with optional filtering and pagination
   */
  async findMany(options: FindOptions = {}): Promise<T[]> {
    const { where, limit, offset, orderBy, with: withRelations } = options;

    const query = db.query[this.tableName as keyof typeof db.query] as { findMany: (opts: unknown) => Promise<T[]> };
    if (!query || typeof query.findMany !== 'function') {
      throw new Error(`Query interface not found for table: ${this.tableName}`);
    }

    return await query.findMany({
      where,
      limit,
      offset,
      orderBy,
      with: withRelations,
    });
  }

  /**
   * Find a single record by condition
   */
  async findFirst(options: FindOptions): Promise<T | undefined> {
    const query = db.query[this.tableName as keyof typeof db.query] as { findFirst: (opts: unknown) => Promise<T | undefined> };
    if (!query || typeof query.findFirst !== 'function') {
      throw new Error(`Query interface not found for table: ${this.tableName}`);
    }

    return await query.findFirst({
      where: options.where,
      with: options.with,
    });
  }

  /**
   * Find by ID
   */
  async findById(id: string, withRelations?: unknown): Promise<T | undefined> {
    const query = db.query[this.tableName as keyof typeof db.query] as { findFirst: (opts: unknown) => Promise<T | undefined> };
    if (!query || typeof query.findFirst !== 'function') {
      throw new Error(`Query interface not found for table: ${this.tableName}`);
    }

    // Import eq dynamically to avoid circular dependencies
    const { eq } = await import('drizzle-orm');

    return await query.findFirst({
      where: eq(this.table.id, id),
      with: withRelations,
    });
  }

  /**
   * Count records matching condition
   */
  async count(where?: SQL): Promise<number> {
    const { count } = await import('drizzle-orm');

    const result = await db
      .select({ count: count() })
      .from(this.table)
      .where(where);

    return Number(result[0]?.count ?? 0);
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<T> {
    const result = await db
      .insert(this.table)
      .values(data)
      .returning() as T[];

    return result[0];
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Partial<T>): Promise<T | undefined> {
    const { eq } = await import('drizzle-orm');

    const result = await db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(this.table.id, id))
      .returning() as T[];

    return result[0];
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<boolean> {
    const { eq } = await import('drizzle-orm');

    const result = await db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning() as T[];

    return result.length > 0;
  }

  /**
   * Check if a record exists
   */
  async exists(where: SQL): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Find with pagination metadata
   */
  async findPaginated(options: FindOptions): Promise<PaginatedResult<T>> {
    const { limit = 50, offset = 0 } = options;

    const [data, total] = await Promise.all([
      this.findMany(options),
      this.count(options.where),
    ]);

    return {
      data,
      total,
      hasMore: offset + limit < total,
    };
  }
}
