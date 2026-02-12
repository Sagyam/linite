import { packages } from '@/db';
import { updatePackageSchema } from '@/lib/validation';
import { createCRUDHandlers } from '@/lib/crud-factory';

// Create CRUD handlers for packages
const handlers = createCRUDHandlers({
  table: packages,
  tableName: 'packages',
  entityName: 'Package',
  updateSchema: updatePackageSchema,
  requireAuthForGet: true, // Packages are admin-only
  withRelations: {
    app: true,
    source: true,
  },
  // No beforeDelete needed - straightforward deletion
});

// Export handlers
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
