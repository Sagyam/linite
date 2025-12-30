import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { getRefreshLogs } from '@/services/package-refresh';

export async function GET(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 500) {
      return NextResponse.json(
        { error: 'limit must be a number between 1 and 500' },
        { status: 400 }
      );
    }

    const logs = await getRefreshLogs(limit);

    return NextResponse.json({
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Refresh logs API error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching logs' },
      { status: 500 }
    );
  }
}
