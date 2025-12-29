import { NextRequest, NextResponse } from 'next/server';
import { refreshPackages } from '@/services/package-refresh';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Invalid cron secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting scheduled package refresh');
    const startTime = Date.now();

    const results = await refreshPackages();

    const duration = Date.now() - startTime;

    // Calculate totals
    const totals = results.reduce(
      (acc, result) => ({
        packagesChecked: acc.packagesChecked + result.packagesChecked,
        packagesUpdated: acc.packagesUpdated + result.packagesUpdated,
        errors: acc.errors + result.errors.length,
      }),
      { packagesChecked: 0, packagesUpdated: 0, errors: 0 }
    );

    console.log('[CRON] Package refresh completed', {
      duration: `${duration}ms`,
      totals,
    });

    return NextResponse.json({
      success: true,
      results,
      totals,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Package refresh error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
