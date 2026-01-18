import { NextRequest, NextResponse } from 'next/server';
import { createPublicApiHandler } from '@/lib/api-middleware';

interface CachedScript {
  content: string;
  expiresAt: number;
}

let scriptCache: CachedScript | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const GET = createPublicApiHandler(
  async (request: NextRequest) => {
    // Return a cached script if available
    if (scriptCache && Date.now() < scriptCache.expiresAt) {
      return new NextResponse(scriptCache.content, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    try {
      // Fetch from Umami
      const response = await fetch('https://cloud.umami.is/script.js');

      if (!response.ok) {
        throw new Error(`Failed to fetch script: ${response.statusText}`);
      }

      const scriptContent = await response.text();

      // Cache for 1 hour
      scriptCache = {
        content: scriptContent,
        expiresAt: Date.now() + CACHE_TTL,
      };

      return new NextResponse(scriptContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      console.error('Umami script proxy error:', error);
      // Graceful fallback - don't break the page
      return new NextResponse('console.warn("Analytics unavailable");', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      });
    }
  }
);
