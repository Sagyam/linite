import { NextRequest } from 'next/server';
import { generateUninstallCommands } from '@/services/uninstall-command-generator';
import { generateUninstallCommandSchema } from '@/lib/validation';
import { createValidatedApiHandler } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';

export const POST = createValidatedApiHandler(
  generateUninstallCommandSchema,
  async (request: NextRequest, data) => {
    try {
      const result = await generateUninstallCommands(data);
      return successResponse(result);
    } catch (error) {
      console.error('Error generating uninstall commands:', error);

      if (error instanceof Error) {
        return errorResponse(error.message, 400);
      }

      return errorResponse('An unexpected error occurred while generating uninstall commands', 500);
    }
  }
);
