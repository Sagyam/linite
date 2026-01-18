import { NextRequest, NextResponse } from 'next/server';
import { createPublicApiHandler } from '@/lib/api-middleware';

export const POST = createPublicApiHandler(
  async (request: NextRequest) => {
    try {
      const body = await request.text();

      // Forward to Umami's collection endpoint
      const response = await fetch('https://cloud.umami.is/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': request.headers.get('user-agent') || '',
        },
        body: body,
      });

      const responseData = await response.text();

      return new NextResponse(responseData, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Umami tracking proxy error:', error);
      // Return 204 to fail silently
      return new NextResponse(null, { status: 204 });
    }
  }
);
