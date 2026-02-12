import { sources, packages } from '@/db';
import { updateSourceSchema, type UpdateSourceInput } from '@/lib/validation';
import { createCRUDHandlers } from '@/lib/crud-factory';

// Type for source with packages relation
type SourceWithPackages = typeof sources.$inferSelect & {
  packages: Array<typeof packages.$inferSelect>;
};

// Create CRUD handlers for sources
const handlers = createCRUDHandlers<UpdateSourceInput, SourceWithPackages>({
  table: sources,
  tableName: 'sources',
  entityName: 'Source',
  updateSchema: updateSourceSchema,
  withRelations: {
    packages: true,
  },
  beforeDelete: async (record) => {
    if (record.packages.length > 0) {
      throw new Error('Cannot delete source with packages. Delete packages first.');
    }
  },
});

// Export handlers
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
