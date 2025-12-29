import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-utils';
import { uploadImage, deleteImage } from '@/lib/blob';

// POST /api/upload - Upload an image to Vercel Blob (admin only)
export async function POST(request: NextRequest) {
  // Require authentication
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pathname = formData.get('pathname') as string | null;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    const url = await uploadImage(file, pathname || undefined);

    return successResponse({ url });
  } catch (error) {
    console.error('Error uploading image:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return errorResponse(message, 500);
  }
}

// DELETE /api/upload - Delete an image from Vercel Blob (admin only)
export async function DELETE(request: NextRequest) {
  // Require authentication
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const { url } = await request.json();

    if (!url) {
      return errorResponse('No URL provided', 400);
    }

    await deleteImage(url);

    return successResponse({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete image';
    return errorResponse(message, 500);
  }
}