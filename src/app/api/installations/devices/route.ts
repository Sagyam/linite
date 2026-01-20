import { NextRequest } from 'next/server';
import { successResponse, errorResponse, requireUser } from '@/lib/api-utils';
import { InstallationHistoryService } from '@/services/installation-history.service';
import { createAuthApiHandler } from '@/lib/api-middleware';

// GET /api/installations/devices - Get user's unique devices
export const GET = createAuthApiHandler(
  async (request: NextRequest) => {
    const authCheck = await requireUser(request);
    if (authCheck.error) {
      return authCheck.error;
    }

    const userId = authCheck.user.id;

    try {
      const devices = await InstallationHistoryService.getUserDevices(userId);

      return successResponse({ devices });
    } catch (error) {
      console.error('Error fetching devices:', error);

      if (error instanceof Error) {
        return errorResponse(error.message, 400);
      }

      return errorResponse('Failed to fetch devices', 500);
    }
  }
);
