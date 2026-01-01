import { db } from '@/db';
import type { SQL } from 'drizzle-orm';

/**
 * Base Repository Pattern
 * Provides generic CRUD operations for database entities
 */

export interface FindOptions<T> {
  where?: SQL;
  limit?: number;
  offset?: number;
  orderBy?: any;
  with?: any;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

/**
 * Generic base repository class
 * Can be extended for entity-specific repositories
 */
export class BaseRepository<T> {
  constructor(
    protected table: any,
    protected tableName: string
  ) {}

  /**
   * Find all records with optional filtering and pagination
   */
  async findMany(options: FindOptions<T> = {}): Promise<T[]> {
    const { where, limit, offset, orderBy, with: withRelations } = options;

    const query: any = db.query[this.tableName as keyof typeof db.query];
    if (!query || typeof query.findMany !== 'function') {
      throw new Error(`Query interface not found for table: ${this.tableName}`);
    }

    return query.findMany({
      where,
      limit,
      offset,
      orderBy,
      with: withRelations,
    }) as Promise<T[]>;
  }

  /**
   * Find a single record by condition
   */
  async findFirst(options: FindOptions<T>): Promise<T | undefined> {
    const query: any = db.query[this.tableName as keyof typeof db.query];
    if (!query || typeof query.findFirst !== 'function') {
      throw new Error(`Query interface not found for table: ${this.tableName}`);
    }

    return query.findFirst({
      where: options.where,
      with: options.with,
    }) as Promise<T | undefined>;
  }

  /**
   * Find by ID
   */
  async findById(id: string, withRelations?: any): Promise<T | undefined> {
    const query: any = db.query[this.tableName as keyof typeof db.query];
    if (!query || typeof query.findFirst !== 'function') {
      throw new Error(`Query interface not found for table: ${this.tableName}`);
    }

    // Import eq dynamically to avoid circular dependencies
    const { eq } = await import('drizzle-orm');

    return query.findFirst({
      where: eq(this.table.id, id),
      with: withRelations,
    }) as Promise<T | undefined>;
  }

  /**
   * Count records matching condition
   */
  async count(where?: SQL): Promise<number> {
    const { count } = await import('drizzle-orm');

    const result: any = await db
      .select({ count: count() })
      .from(this.table)
      .where(where);

    return result[0]?.count ?? 0;
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<T> {
    const result: any = await db
      .insert(this.table)
      .values(data)
      .returning();

    return result[0] as T;
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Partial<T>): Promise<T | undefined> {
    const { eq } = await import('drizzle-orm');

    const result: any = await db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(this.table.id, id))
      .returning();

    return result[0] as T | undefined;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<boolean> {
    const { eq } = await import('drizzle-orm');

    const result: any = await db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();

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
  async findPaginated(options: FindOptions<T>): Promise<PaginatedResult<T>> {
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
