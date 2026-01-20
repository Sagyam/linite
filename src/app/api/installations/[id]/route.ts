import { NextRequest } from 'next/server';
import { successResponse, errorResponse, requireUser } from '@/lib/api-utils';
import { InstallationHistoryService } from '@/services/installation-history.service';
import { createAuthApiHandler, createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { updateInstallationSchema } from '@/lib/validation';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/installations/[id] - Get single installation
export const GET = createAuthApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const authCheck = await requireUser(request);
    if (authCheck.error) {
      return authCheck.error;
    }

    const userId = authCheck.user.id;
    const params = await context?.params;
    const installationId = params?.id;

    if (!installationId) {
      return errorResponse('Installation ID is required', 400);
    }

    try {
      const installation = await InstallationHistoryService.getInstallationById(
        installationId,
        userId
      );

      if (!installation) {
        return errorResponse('Installation not found', 404);
      }

      return successResponse(installation);
    } catch (error) {
      console.error('Error fetching installation:', error);

      if (error instanceof Error) {
        return errorResponse(error.message, 400);
      }

      return errorResponse('Failed to fetch installation', 500);
    }
  }
);

// PATCH /api/installations/[id] - Update installation
export const PATCH = createAuthValidatedApiHandler(
  updateInstallationSchema,
  async (request, data, context?: RouteContext) => {
    const authCheck = await requireUser(request);
    if (authCheck.error) {
      return authCheck.error;
    }

    const userId = authCheck.user.id;
    const params = await context?.params;
    const installationId = params?.id;

    if (!installationId) {
      return errorResponse('Installation ID is required', 400);
    }

    try {
      const updated = await InstallationHistoryService.updateInstallation(
        installationId,
        userId,
        data
      );

      return successResponse(updated);
    } catch (error) {
      console.error('Error updating installation:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          return errorResponse(error.message, 404);
        }
        return errorResponse(error.message, 400);
      }

      return errorResponse('Failed to update installation', 500);
    }
  }
);

// DELETE /api/installations/[id] - Delete installation
export const DELETE = createAuthApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const authCheck = await requireUser(request);
    if (authCheck.error) {
      return authCheck.error;
    }

    const userId = authCheck.user.id;
    const params = await context?.params;
    const installationId = params?.id;

    if (!installationId) {
      return errorResponse('Installation ID is required', 400);
    }

    try {
      await InstallationHistoryService.deleteInstallation(installationId, userId);

      return successResponse({ success: true });
    } catch (error) {
      console.error('Error deleting installation:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          return errorResponse(error.message, 404);
        }
        return errorResponse(error.message, 400);
      }

      return errorResponse('Failed to delete installation', 500);
    }
  }
);
