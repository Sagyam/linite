import { apps } from '@/db';
import { updateAppSchema } from '@/lib/validation';
import { createCRUDHandlers } from '@/lib/crud-factory';

// Create CRUD handlers for apps
const handlers = createCRUDHandlers({
  table: apps,
  tableName: 'apps',
  entityName: 'App',
  updateSchema: updateAppSchema,
  withRelations: {
    category: true,
    packages: {
      with: {
        source: true,
      },
    },
  },
  // No beforeDelete needed - packages cascade delete automatically
});

// Export handlers
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
