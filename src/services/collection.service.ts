import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, desc, sql, like } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { randomBytes } from 'crypto';
import type { Collection, CollectionWithRelations } from '@/types/entities';

/**
 * Collection Service
 * Business logic for collection operations
 */

function generateSlug(name: string, userId: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);

  // Add a short random suffix to ensure uniqueness
  const suffix = userId.slice(-6);
  return `${baseSlug}-${suffix}`;
}

function createShareToken(): string {
  return randomBytes(16).toString('hex');
}

// Helper to normalize database types to our Collection type
function normalizeCollection(dbCollection: any): Collection {
  return {
    ...dbCollection,
    isPublic: dbCollection.isPublic ?? false,
    isFeatured: dbCollection.isFeatured ?? false,
    isTemplate: dbCollection.isTemplate ?? false,
    viewCount: dbCollection.viewCount ?? 0,
    installCount: dbCollection.installCount ?? 0,
    displayOrder: dbCollection.displayOrder ?? 0,
    createdAt: dbCollection.createdAt ?? undefined,
    updatedAt: dbCollection.updatedAt ?? undefined,
  };
}

export interface CreateCollectionData {
  userId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  iconUrl?: string;
  appIds: string[];
}

export interface UpdateCollectionData {
  name?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  iconUrl?: string;
  appIds?: string[];
}

export interface ListCollectionsOptions {
  userId?: string;
  featured?: boolean;
  search?: string;
  tags?: string[];
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

export async function createCollection(data: CreateCollectionData): Promise<Collection> {
  const slug = generateSlug(data.name, data.userId);

  // Create collection
  const [collection] = await db
    .insert(schema.collections)
    .values({
      id: createId(),
      userId: data.userId,
      name: data.name,
      description: data.description || null,
      slug,
      isPublic: data.isPublic ?? false,
      tags: data.tags || null,
      iconUrl: data.iconUrl || null,
      isFeatured: false,
      isTemplate: false,
      shareToken: null,
      viewCount: 0,
      installCount: 0,
    })
    .returning();

  // Add apps to collection
  if (data.appIds.length > 0) {
    const items = data.appIds.map((appId, index) => ({
      id: createId(),
      collectionId: collection.id,
      appId,
      displayOrder: index,
      note: null,
    }));

    await db.insert(schema.collectionItems).values(items);
  }

  return normalizeCollection(collection);
}

export async function updateCollection(
  collectionId: string,
  data: UpdateCollectionData
): Promise<Collection> {
  const updates: Partial<Collection> = {};

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.isPublic !== undefined) updates.isPublic = data.isPublic;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.iconUrl !== undefined) updates.iconUrl = data.iconUrl;

  const [updated] = await db
    .update(schema.collections)
    .set(updates)
    .where(eq(schema.collections.id, collectionId))
    .returning();

  if (!updated) {
    throw new Error('Collection not found');
  }

  // Update collection items if appIds are provided
  if (data.appIds !== undefined) {
    // Delete all existing items
    await db
      .delete(schema.collectionItems)
      .where(eq(schema.collectionItems.collectionId, collectionId));

    // Add new items
    if (data.appIds.length > 0) {
      const items = data.appIds.map((appId, index) => ({
        id: createId(),
        collectionId,
        appId,
        displayOrder: index,
        note: null,
      }));

      await db.insert(schema.collectionItems).values(items);
    }
  }

  return normalizeCollection(updated);
}

export async function deleteCollection(collectionId: string): Promise<void> {
  await db.delete(schema.collections).where(eq(schema.collections.id, collectionId));
}

export async function getCollectionById(
  collectionId: string,
  userId?: string
): Promise<CollectionWithRelations | null> {
  const collection = await db.query.collections.findFirst({
    where: and(
      eq(schema.collections.id, collectionId),
      userId
        ? or(
            eq(schema.collections.userId, userId),
            eq(schema.collections.isPublic, true)
          )
        : eq(schema.collections.isPublic, true)
    ),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
      items: {
        with: {
          app: {
            with: {
              category: true,
              packages: {
                with: {
                  source: true,
                },
              },
            },
          },
        },
        orderBy: (items, { asc }) => [asc(items.displayOrder)],
      },
    },
  });

  if (!collection) return null;

  // Get like count
  const [likeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.collectionLikes)
    .where(eq(schema.collectionLikes.collectionId, collectionId));

  return {
    ...collection,
    _count: {
      likes: likeCount?.count || 0,
    },
  } as CollectionWithRelations;
}

export async function getCollectionBySlug(
  slug: string,
  userId?: string
): Promise<CollectionWithRelations | null> {
  const collection = await db.query.collections.findFirst({
    where: and(
      eq(schema.collections.slug, slug),
      userId
        ? or(
            eq(schema.collections.userId, userId),
            eq(schema.collections.isPublic, true)
          )
        : eq(schema.collections.isPublic, true)
    ),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
      items: {
        with: {
          app: {
            with: {
              category: true,
              packages: {
                with: {
                  source: true,
                },
              },
            },
          },
        },
        orderBy: (items, { asc }) => [asc(items.displayOrder)],
      },
    },
  });

  if (!collection) return null;

  // Get like count
  const [likeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.collectionLikes)
    .where(eq(schema.collectionLikes.collectionId, collection.id));

  return {
    ...collection,
    _count: {
      likes: likeCount?.count || 0,
    },
  } as CollectionWithRelations;
}

export async function getCollectionByShareToken(
  shareToken: string
): Promise<CollectionWithRelations | null> {
  const collection = await db.query.collections.findFirst({
    where: eq(schema.collections.shareToken, shareToken),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
      items: {
        with: {
          app: {
            with: {
              category: true,
              packages: {
                with: {
                  source: true,
                },
              },
            },
          },
        },
        orderBy: (items, { asc }) => [asc(items.displayOrder)],
      },
    },
  });

  if (!collection) return null;

  // Increment view count
  await db
    .update(schema.collections)
    .set({ viewCount: sql`${schema.collections.viewCount} + 1` })
    .where(eq(schema.collections.id, collection.id));

  // Get like count
  const [likeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.collectionLikes)
    .where(eq(schema.collectionLikes.collectionId, collection.id));

  return {
    ...collection,
    _count: {
      likes: likeCount?.count || 0,
    },
  } as CollectionWithRelations;
}

export async function listCollections(
  options: ListCollectionsOptions
): Promise<{ collections: CollectionWithRelations[]; total: number }> {
  const {
    userId,
    featured,
    search,
    tags,
    isPublic,
    limit = 20,
    offset = 0,
  } = options;

  const conditions = [];

  if (userId) {
    conditions.push(eq(schema.collections.userId, userId));
  }

  if (featured !== undefined) {
    conditions.push(eq(schema.collections.isFeatured, featured));
  }

  if (isPublic !== undefined) {
    conditions.push(eq(schema.collections.isPublic, isPublic));
  }

  if (search) {
    conditions.push(
      or(
        like(schema.collections.name, `%${search}%`),
        like(schema.collections.description, `%${search}%`)
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get collections with relations
  const collections = await db.query.collections.findMany({
    where: whereClause,
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
      items: {
        with: {
          app: true,
        },
        orderBy: (items, { asc }) => [asc(items.displayOrder)],
      },
    },
    orderBy: [desc(schema.collections.createdAt)],
    limit,
    offset,
  });

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.collections)
    .where(whereClause);

  // Add like counts
  const collectionsWithCounts = await Promise.all(
    collections.map(async (collection) => {
      const [likeCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.collectionLikes)
        .where(eq(schema.collectionLikes.collectionId, collection.id));

      return {
        ...collection,
        _count: {
          likes: likeCount?.count || 0,
        },
      };
    })
  );

  return {
    collections: collectionsWithCounts as CollectionWithRelations[],
    total: count || 0,
  };
}

export async function generateShareToken(collectionId: string): Promise<string> {
  const token = createShareToken();

  await db
    .update(schema.collections)
    .set({ shareToken: token })
    .where(eq(schema.collections.id, collectionId));

  return token;
}

export async function addItemToCollection(
  collectionId: string,
  appId: string,
  note?: string
): Promise<void> {
  // Get current max display order
  const [maxOrder] = await db
    .select({ max: sql<number>`max(${schema.collectionItems.displayOrder})` })
    .from(schema.collectionItems)
    .where(eq(schema.collectionItems.collectionId, collectionId));

  const displayOrder = (maxOrder?.max || -1) + 1;

  await db.insert(schema.collectionItems).values({
    id: createId(),
    collectionId,
    appId,
    displayOrder,
    note: note || null,
  });
}

export async function removeItemFromCollection(itemId: string): Promise<void> {
  await db.delete(schema.collectionItems).where(eq(schema.collectionItems.id, itemId));
}

export async function toggleLike(
  collectionId: string,
  userId: string
): Promise<{ liked: boolean }> {
  // Check if already liked
  const existing = await db.query.collectionLikes.findFirst({
    where: and(
      eq(schema.collectionLikes.collectionId, collectionId),
      eq(schema.collectionLikes.userId, userId)
    ),
  });

  if (existing) {
    // Unlike
    await db.delete(schema.collectionLikes).where(eq(schema.collectionLikes.id, existing.id));
    return { liked: false };
  } else {
    // Like
    await db.insert(schema.collectionLikes).values({
      id: createId(),
      collectionId,
      userId,
    });
    return { liked: true };
  }
}

export async function cloneCollection(
  collectionId: string,
  newUserId: string
): Promise<Collection> {
  const original = await getCollectionById(collectionId);
  if (!original) {
    throw new Error('Collection not found');
  }

  // Create new collection
  const cloned = await createCollection({
    userId: newUserId,
    name: `${original.name} (Copy)`,
    description: original.description || undefined,
    isPublic: false, // Clones are private by default
    tags: original.tags || undefined,
    iconUrl: original.iconUrl || undefined,
    appIds: original.items.map((item) => item.appId),
  });

  return cloned;
}

export async function incrementViewCount(collectionId: string): Promise<void> {
  await db
    .update(schema.collections)
    .set({ viewCount: sql`${schema.collections.viewCount} + 1` })
    .where(eq(schema.collections.id, collectionId));
}

export async function incrementInstallCount(collectionId: string): Promise<void> {
  await db
    .update(schema.collections)
    .set({ installCount: sql`${schema.collections.installCount} + 1` })
    .where(eq(schema.collections.id, collectionId));
}
