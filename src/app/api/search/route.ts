import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { searchFlathub } from '@/services/external-apis/flathub';
import { searchSnapcraft } from '@/services/external-apis/snapcraft';
import { searchRepology } from '@/services/external-apis/repology';
import { searchAUR } from '@/services/external-apis/aur';
import { searchHomebrew } from '@/services/external-apis/homebrew';
import { searchWinget } from '@/services/external-apis/winget';
import { PackageSearchResult } from '@/services/external-apis/types';

interface SearchRequest {
  source: 'flatpak' | 'snap' | 'repology' | 'aur' | 'homebrew' | 'winget' | 'all';
  query: string;
}

interface SearchResponse {
  results: PackageSearchResult[];
  source: string;
  query: string;
  count: number;
  errors?: string[];
}

export async function POST(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const body = await request.json();

    // Validate input
    if (!body.query || typeof body.query !== 'string' || body.query.trim().length === 0) {
      return NextResponse.json(
        { error: 'query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!body.source || typeof body.source !== 'string') {
      return NextResponse.json(
        { error: 'source is required and must be a string (flatpak, snap, repology, aur, or all)' },
        { status: 400 }
      );
    }

    const searchRequest: SearchRequest = {
      source: body.source,
      query: body.query.trim(),
    };

    const validSources = ['flatpak', 'snap', 'repology', 'aur', 'homebrew', 'winget', 'all'];
    if (!validSources.includes(searchRequest.source)) {
      return NextResponse.json(
        { error: `source must be one of: ${validSources.join(', ')}` },
        { status: 400 }
      );
    }

    // Execute search based on source
    if (searchRequest.source === 'all') {
      // Search all sources in parallel
      const results = await Promise.allSettled([
        searchFlathub(searchRequest.query),
        searchSnapcraft(searchRequest.query),
        searchRepology(searchRequest.query),
        searchAUR(searchRequest.query),
        searchHomebrew(searchRequest.query),
        searchWinget(searchRequest.query),
      ]);

      const allResults: PackageSearchResult[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        const sourceName = ['Flathub', 'Snapcraft', 'Repology', 'AUR', 'Homebrew', 'Winget'][index];

        if (result.status === 'fulfilled') {
          allResults.push(...result.value);
        } else {
          errors.push(`${sourceName}: ${result.reason.message || 'Unknown error'}`);
        }
      });

      const response: SearchResponse = {
        results: allResults,
        source: 'all',
        query: searchRequest.query,
        count: allResults.length,
        errors: errors.length > 0 ? errors : undefined,
      };

      return NextResponse.json(response);
    } else {
      // Search single source
      let results: PackageSearchResult[] = [];

      switch (searchRequest.source) {
        case 'flatpak':
          results = await searchFlathub(searchRequest.query);
          break;
        case 'snap':
          results = await searchSnapcraft(searchRequest.query);
          break;
        case 'repology':
          results = await searchRepology(searchRequest.query);
          break;
        case 'aur':
          results = await searchAUR(searchRequest.query);
          break;
        case 'homebrew':
          results = await searchHomebrew(searchRequest.query);
          break;
        case 'winget':
          results = await searchWinget(searchRequest.query);
          break;
      }

      const response: SearchResponse = {
        results,
        source: searchRequest.source,
        query: searchRequest.query,
        count: results.length,
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Search API error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while searching' },
      { status: 500 }
    );
  }
}
