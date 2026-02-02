import { NextRequest } from 'next/server';
import { successResponse, errorResponse, requireUser } from '@/lib/api-utils';
import { InstallationHistoryService } from '@/services/installation-history.service';
import { createAuthValidatedApiHandler, createQueryValidatedApiHandler } from '@/lib/api-middleware';
import { createInstallationSchema, getInstallationsQuerySchema } from '@/lib/validation';
import type { GetInstallationsResponse, CreateInstallationResponse } from '@/types';

// GET /api/installations - Get user's installation history
export const GET = createQueryValidatedApiHandler(
  getInstallationsQuerySchema,
  async (request: NextRequest, query) => {
    const authCheck = await requireUser(request);
    if (authCheck.error) {
      return authCheck.error;
    }

    const userId = authCheck.user.id;

    try {
      const installations = await InstallationHistoryService.getUserInstallations(
        userId,
        query
      );

      return successResponse(installations as GetInstallationsResponse);
    } catch (error) {
      console.error('Error fetching installations:', error);

      if (error instanceof Error) {
        return errorResponse(error.message, 400);
      }

      return errorResponse('Failed to fetch installations', 500);
    }
  },
  { requireAuth: true }
);

// POST /api/installations - Create new installation record
export const POST = createAuthValidatedApiHandler(
  createInstallationSchema,
  async (request, data) => {
    const authCheck = await requireUser(request);
    if (authCheck.error) {
      return authCheck.error;
    }

    const userId = authCheck.user.id;

    try {
      const newInstallation = await InstallationHistoryService.createInstallation(
        userId,
        data
      );

      return successResponse(newInstallation as CreateInstallationResponse, 201);
    } catch (error) {
      console.error('Error creating installation:', error);

      if (error instanceof Error) {
        return errorResponse(error.message, 400);
      }

      return errorResponse('Failed to create installation', 500);
    }
  }
);
