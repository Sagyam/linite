import { NextRequest } from 'next/server';
import { successResponse, errorResponse, requireUser } from '@/lib/api-utils';
import { InstallationHistoryService } from '@/services/installation-history.service';
import { createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { bulkDeleteInstallationsSchema } from '@/lib/validation';

// POST /api/installations/bulk-delete - Delete multiple installations
export const POST = createAuthValidatedApiHandler(
  bulkDeleteInstallationsSchema,
  async (request, data) => {
    const authCheck = await requireUser(request);
    if (authCheck.error) {
      return authCheck.error;
    }

    const userId = authCheck.user.id;
    const { installationIds } = data;

    try {
      await InstallationHistoryService.bulkDeleteInstallations(
        installationIds,
        userId
      );

      return successResponse({ success: true, deletedCount: installationIds.length });
    } catch (error) {
      console.error('Error bulk deleting installations:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          return errorResponse(error.message, 404);
        }
        return errorResponse(error.message, 400);
      }

      return errorResponse('Failed to delete installations', 500);
    }
  }
);
