import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock functions outside the vi.mock call
const mockUploadData = vi.fn();
const mockDeleteIfExists = vi.fn();
const mockExists = vi.fn();
const mockListBlobsFlat = vi.fn();

// Track blob client creations to get the correct URL
const createdBlobClients: Map<string, { url: string }> = new Map();

const createMockBlockBlobClient = (pathname: string) => {
  const client = {
    uploadData: mockUploadData,
    deleteIfExists: mockDeleteIfExists,
    exists: mockExists,
    url: `https://linite.blob.core.windows.net/linite-icons/${pathname}?sas=token`,
  };
  createdBlobClients.set(pathname, client);
  return client;
};

const createMockContainerClient = () => ({
  getBlockBlobClient: vi.fn((pathname: string) => createMockBlockBlobClient(pathname)),
  listBlobsFlat: mockListBlobsFlat,
});

// Mock Azure SDK with class-based approach
vi.mock('@azure/storage-blob', () => {
  return {
    BlobServiceClient: class MockBlobServiceClient {
      constructor() {}
      getContainerClient() {
        return createMockContainerClient();
      }
    },
    ContainerClient: class MockContainerClient {},
  };
});

// Mock env
vi.mock('@/lib/env', () => ({
  env: {
    AZURE_STORAGE_SAS_URL:
      'https://linite.blob.core.windows.net/linite-icons?sv=2022-11-02&ss=b&srt=sco&sp=rwdlacuptfx&se=2030-01-01',
    WIKIPEDIA_ACCESS_TOKEN: 'mock-token',
  },
}));

// Mock constants with minimal retry delays for testing
vi.mock('@/lib/constants', () => ({
  RETRY_CONFIG: {
    MAX_RETRIES: 2,
    INITIAL_RETRY_DELAY: 10,
    MAX_RETRY_DELAY: 50,
    BACKOFF_MULTIPLIER: 2,
    JITTER_FACTOR: 0,
  },
}));

// Mock image-optimizer
vi.mock('@/lib/image-optimizer', () => ({
  generateImageVariants: vi.fn().mockResolvedValue({
    variants: [
      { size: 64, buffer: Buffer.from('mock-64'), format: 'webp' },
      { size: 128, buffer: Buffer.from('mock-128'), format: 'webp' },
    ],
    shouldOptimize: true,
  }),
  getExtensionFromContentType: vi.fn((contentType: string) => {
    if (contentType.includes('svg')) return 'svg';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
    if (contentType.includes('webp')) return 'webp';
    return 'png';
  }),
  shouldOptimizeImage: vi.fn((contentType: string) => !contentType.includes('svg')),
}));

// Mock fetch
global.fetch = vi.fn();

import {
  uploadImage,
  uploadImageFromUrl,
  deleteImage,
  listImages,
  checkBlobExists,
} from './blob';

describe('blob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createdBlobClients.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUploadData.mockResolvedValue(undefined);
    mockDeleteIfExists.mockResolvedValue(undefined);
    mockExists.mockResolvedValue(false);
  });

  describe('uploadImage', () => {
    const createMockFile = (
      type: string,
      size: number = 1024,
      name: string = 'test.png'
    ): File => {
      const content = new ArrayBuffer(size);
      return new File([content], name, { type });
    };

    it('should upload PNG file with variants', async () => {
      const file = createMockFile('image/png');

      const result = await uploadImage(file, 'app-icons/firefox.png');

      expect(result.original).toContain('firefox-original.png');
      expect(result.variants).toHaveProperty('64');
      expect(result.variants).toHaveProperty('128');
      expect(mockUploadData).toHaveBeenCalled();
    });

    it('should upload SVG file without variants', async () => {
      const file = createMockFile('image/svg+xml', 1024, 'icon.svg');

      const result = await uploadImage(file, 'app-icons/icon.svg');

      expect(result.original).toContain('icon.svg');
      expect(result.variants).toEqual({});
    });

    it('should reject invalid file types', async () => {
      const file = createMockFile('application/pdf', 1024, 'doc.pdf');

      await expect(uploadImage(file)).rejects.toThrow(
        'Invalid file type. Only PNG, JPEG, WebP, and SVG are allowed.'
      );
    });

    it('should reject files over 5MB', async () => {
      const file = createMockFile('image/png', 6 * 1024 * 1024);

      await expect(uploadImage(file)).rejects.toThrow(
        'File size exceeds 5MB limit'
      );
    });

    it('should accept JPEG files', async () => {
      const file = createMockFile('image/jpeg', 1024, 'photo.jpg');

      const result = await uploadImage(file, 'app-icons/photo.jpg');

      expect(result.original).toBeDefined();
    });

    it('should accept WebP files', async () => {
      const file = createMockFile('image/webp', 1024, 'image.webp');

      const result = await uploadImage(file, 'app-icons/image.webp');

      expect(result.original).toBeDefined();
    });

    it('should generate pathname when not provided', async () => {
      const file = createMockFile('image/svg+xml', 1024, 'icon.svg');

      const result = await uploadImage(file);

      expect(result.original).toContain('app-icons/');
      expect(result.original).toContain('icon.svg');
    });

    it('should set correct content type header for original', async () => {
      const file = createMockFile('image/png', 1024, 'test.png');

      await uploadImage(file, 'app-icons/test.png');

      expect(mockUploadData).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          blobHTTPHeaders: {
            blobContentType: 'image/png',
          },
        })
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete all variants and original file', async () => {
      await deleteImage(
        'https://linite.blob.core.windows.net/linite-icons/app-icons/firefox-64.webp'
      );

      // Should delete the specific blob
      expect(mockDeleteIfExists).toHaveBeenCalled();

      // Should attempt to delete all variant sizes (16, 32, 48, 64, 96, 128)
      // Plus original files for each extension (png, jpg, jpeg, webp, svg)
      // Plus legacy format files
      expect(mockDeleteIfExists.mock.calls.length).toBeGreaterThan(1);
    });

    it('should handle original file URL format', async () => {
      await deleteImage(
        'https://linite.blob.core.windows.net/linite-icons/app-icons/firefox-original.png'
      );

      expect(mockDeleteIfExists).toHaveBeenCalled();
    });

    it('should handle legacy single file URL format', async () => {
      await deleteImage(
        'https://linite.blob.core.windows.net/linite-icons/app-icons/firefox.png'
      );

      expect(mockDeleteIfExists).toHaveBeenCalled();
    });
  });

  describe('listImages', () => {
    it('should list all images in the container', async () => {
      const mockBlobs = [
        {
          name: 'app-icons/firefox-64.webp',
          properties: {
            contentLength: 1024,
            createdOn: new Date('2024-01-01'),
          },
        },
        {
          name: 'app-icons/chrome-64.webp',
          properties: {
            contentLength: 2048,
            createdOn: new Date('2024-01-02'),
          },
        },
      ];

      mockListBlobsFlat.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const blob of mockBlobs) {
            yield blob;
          }
        },
      });

      const result = await listImages();

      expect(result.blobs).toHaveLength(2);
      expect(result.blobs[0].pathname).toBe('app-icons/firefox-64.webp');
      expect(result.blobs[0].size).toBe(1024);
    });

    it('should use default prefix when not provided', async () => {
      mockListBlobsFlat.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          // Empty iterator
        },
      });

      await listImages();

      expect(mockListBlobsFlat).toHaveBeenCalledWith({ prefix: 'app-icons/' });
    });

    it('should use custom prefix when provided', async () => {
      mockListBlobsFlat.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          // Empty iterator
        },
      });

      await listImages('distro-icons/');

      expect(mockListBlobsFlat).toHaveBeenCalledWith({
        prefix: 'distro-icons/',
      });
    });

    it('should handle blobs with missing properties', async () => {
      const mockBlobs = [
        {
          name: 'app-icons/test.png',
          properties: {},
        },
      ];

      mockListBlobsFlat.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const blob of mockBlobs) {
            yield blob;
          }
        },
      });

      const result = await listImages();

      expect(result.blobs[0].size).toBe(0);
      expect(result.blobs[0].uploadedAt).toBeInstanceOf(Date);
    });
  });

  describe('checkBlobExists', () => {
    it('should return URL when blob exists', async () => {
      mockExists.mockResolvedValueOnce(true);

      const result = await checkBlobExists('app-icons/firefox.svg');

      expect(result).toContain('app-icons/firefox.svg');
      expect(result).not.toContain('?');
    });

    it('should return null when blob does not exist', async () => {
      mockExists.mockResolvedValueOnce(false);

      const result = await checkBlobExists('app-icons/nonexistent.png');

      expect(result).toBeNull();
    });

    it('should return null when error occurs', async () => {
      mockExists.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkBlobExists('app-icons/error.png');

      expect(result).toBeNull();
    });
  });

  describe('uploadImageFromUrl', () => {
    it('should download and upload image successfully', async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/icon.png',
        'firefox'
      );

      expect(result).not.toBeNull();
      expect(result?.original).toContain('firefox-original.png');
      expect(result?.variants).toHaveProperty('64');
    });

    it('should handle SVG files without creating variants', async () => {
      const mockArrayBuffer = new ArrayBuffer(512);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/svg+xml' }),
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/icon.svg',
        'firefox'
      );

      expect(result).not.toBeNull();
      expect(result?.original).toContain('firefox.svg');
      expect(result?.variants).toEqual({});
    });

    it('should return null when download fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/notfound.png',
        'missing'
      );

      expect(result).toBeNull();
    });

    it('should retry on rate limit error (429)', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'image/png' }),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/icon.png',
        'firefox'
      );

      expect(result).not.toBeNull();
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on server error (5xx)', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'image/png' }),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/icon.png',
        'firefox'
      );

      expect(result).not.toBeNull();
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on network error', async () => {
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'image/png' }),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/icon.png',
        'firefox'
      );

      expect(result).not.toBeNull();
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should return null after max retries', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
      } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/icon.png',
        'firefox'
      );

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledTimes(3); // initial + 2 retries (MAX_RETRIES = 2)
    });

    it('should not retry on 4xx errors (except 429)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/icon.png',
        'firefox'
      );

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should use custom prefix', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/svg+xml' }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(512)),
      } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/icon.svg',
        'ubuntu',
        'distro-icons'
      );

      expect(result?.original).toContain('distro-icons');
    });

    it('should skip upload if blob already exists when skipIfExists is true', async () => {
      // Mock exists to return true for variant checks
      mockExists.mockResolvedValue(true);

      const result = await uploadImageFromUrl(
        'https://example.com/icon.png',
        'firefox',
        'app-icons',
        true
      );

      expect(result).not.toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should not skip upload if blob does not exist when skipIfExists is true', async () => {
      mockExists.mockResolvedValue(false);
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/icon.png',
        'firefox',
        'app-icons',
        true
      );

      expect(result).not.toBeNull();
      expect(fetch).toHaveBeenCalled();
    });

    it('should add Wikipedia auth header for wikimedia URLs', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      } as Response);

      await uploadImageFromUrl(
        'https://upload.wikimedia.org/wikipedia/icon.png',
        'firefox'
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://upload.wikimedia.org/wikipedia/icon.png',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should not add Wikipedia auth header for non-wikipedia URLs', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      } as Response);

      await uploadImageFromUrl('https://example.com/icon.png', 'firefox');

      const callHeaders = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<
        string,
        string
      >;
      expect(callHeaders.Authorization).toBeUndefined();
    });

    it('should handle Azure upload failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/png' }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      } as Response);

      mockUploadData.mockRejectedValueOnce(new Error('Azure upload failed'));

      const result = await uploadImageFromUrl(
        'https://example.com/icon.png',
        'firefox'
      );

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('should default content type to image/png when not provided', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({}), // No content-type header
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      } as Response);

      const result = await uploadImageFromUrl(
        'https://example.com/icon',
        'firefox'
      );

      expect(result).not.toBeNull();
      expect(result?.original).toContain('.png');
    });
  });

  describe('retry delay calculation', () => {
    it('should calculate increasing delays with backoff', async () => {
      // Make all fetch calls fail with rate limit
      let callCount = 0;
      vi.mocked(fetch).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 429,
        } as Response);
      });

      const startTime = Date.now();
      await uploadImageFromUrl('https://example.com/icon.png', 'firefox');
      const endTime = Date.now();

      // Should have taken at least some time for retries
      expect(endTime - startTime).toBeGreaterThanOrEqual(10);
      expect(callCount).toBe(3); // initial + 2 retries
    });
  });

  describe('URL parsing', () => {
    it('should extract blob name correctly from URL', async () => {
      await deleteImage(
        'https://linite.blob.core.windows.net/linite-icons/nested/path/to/icon.png'
      );

      // Verify that the delete was called
      expect(mockDeleteIfExists).toHaveBeenCalled();
    });
  });
});
