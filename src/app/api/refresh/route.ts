import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { refreshPackages, RefreshOptions } from '@/services/package-refresh';

export async function POST(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const body = await request.json().catch(() => ({}));

    const options: RefreshOptions = {
      sourceId: body.sourceId,
      dryRun: body.dryRun === true,
    };

    // Validate sourceId if provided
    if (options.sourceId && typeof options.sourceId !== 'string') {
      return NextResponse.json(
        { error: 'sourceId must be a string' },
        { status: 400 }
      );
    }

    const results = await refreshPackages(options);

    // Calculate totals
    const totals = results.reduce(
      (acc, result) => ({
        packagesChecked: acc.packagesChecked + result.packagesChecked,
        packagesUpdated: acc.packagesUpdated + result.packagesUpdated,
        errors: acc.errors + result.errors.length,
        duration: acc.duration + result.duration,
      }),
      { packagesChecked: 0, packagesUpdated: 0, errors: 0, duration: 0 }
    );

    return NextResponse.json({
      success: true,
      results,
      totals,
      dryRun: options.dryRun || false,
    });
  } catch (error) {
    console.error('Refresh API error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during refresh' },
      { status: 500 }
    );
  }
}
