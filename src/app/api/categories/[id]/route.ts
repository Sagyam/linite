import { categories, apps } from '@/db';
import { updateCategorySchema, type UpdateCategoryInput } from '@/lib/validation';
import { createCRUDHandlers } from '@/lib/crud-factory';

// Type for category with apps relation
type CategoryWithApps = typeof categories.$inferSelect & {
  apps: Array<typeof apps.$inferSelect>;
};

// Create CRUD handlers for categories
const handlers = createCRUDHandlers<UpdateCategoryInput, CategoryWithApps>({
  table: categories,
  tableName: 'categories',
  entityName: 'Category',
  updateSchema: updateCategorySchema,
  withRelations: {
    apps: true,
  },
  beforeDelete: async (record) => {
    if (record.apps.length > 0) {
      throw new Error('Cannot delete category with apps. Move or delete apps first.');
    }
  },
});

// Export handlers
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
