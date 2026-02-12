import { distros } from '@/db';
import { updateDistroSchema } from '@/lib/validation';
import { createCRUDHandlers } from '@/lib/crud-factory';

// Create CRUD handlers for distros
const handlers = createCRUDHandlers({
  table: distros,
  tableName: 'distros',
  entityName: 'Distro',
  updateSchema: updateDistroSchema,
  withRelations: {
    distroSources: {
      with: {
        source: true,
      },
    },
  },
  // No beforeDelete needed - cascade handled by schema
});

// Export handlers
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
