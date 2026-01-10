import { NextRequest, NextResponse } from 'next/server';
import { generateInstallCommands, GenerateCommandRequest } from '@/services/command-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.distroSlug || typeof body.distroSlug !== 'string') {
      return NextResponse.json(
        { error: 'distroSlug is required and must be a string' },
        { status: 400 }
      );
    }

    if (!body.appIds || !Array.isArray(body.appIds) || body.appIds.length === 0) {
      return NextResponse.json(
        { error: 'appIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate sourcePreference if provided
    if (body.sourcePreference && typeof body.sourcePreference !== 'string') {
      return NextResponse.json(
        { error: 'sourcePreference must be a string' },
        { status: 400 }
      );
    }

    // Validate nixosInstallMethod if provided
    if (body.nixosInstallMethod && typeof body.nixosInstallMethod !== 'string') {
      return NextResponse.json(
        { error: 'nixosInstallMethod must be a string' },
        { status: 400 }
      );
    }

    if (
      body.nixosInstallMethod &&
      !['nix-shell', 'nix-env', 'nix-flakes'].includes(body.nixosInstallMethod)
    ) {
      return NextResponse.json(
        { error: 'nixosInstallMethod must be one of: nix-shell, nix-env, nix-flakes' },
        { status: 400 }
      );
    }

    const requestData: GenerateCommandRequest = {
      distroSlug: body.distroSlug,
      appIds: body.appIds,
      sourcePreference: body.sourcePreference,
      nixosInstallMethod: body.nixosInstallMethod,
    };

    const result = await generateInstallCommands(requestData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating commands:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while generating commands' },
      { status: 500 }
    );
  }
}
