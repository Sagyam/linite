import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClipboard, useMultiClipboard } from './use-clipboard';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
  configurable: true,
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('useClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with copied as false', () => {
      const { result } = renderHook(() => useClipboard());

      expect(result.current.copied).toBe(false);
    });
  });

  describe('copy function', () => {
    it('should copy text to clipboard successfully', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('Hello, World!');
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith('Hello, World!');
      expect(result.current.copied).toBe(true);
    });

    it('should show success toast with default message', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });

    it('should show success toast with custom message', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useClipboard({ successMessage: 'Custom success!' })
      );

      await act(async () => {
        await result.current.copy('test');
      });

      expect(toast.success).toHaveBeenCalledWith('Custom success!');
    });

    it('should reset copied state after default delay', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.copied).toBe(false);
    });

    it('should reset copied state after custom delay', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClipboard({ resetDelay: 5000 }));

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      // After 4 seconds, still copied
      await act(async () => {
        vi.advanceTimersByTime(4000);
      });
      expect(result.current.copied).toBe(true);

      // After 5 seconds, reset
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.copied).toBe(false);
    });

    it('should handle clipboard write failure', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Permission denied'));

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Failed to copy to clipboard');
    });

    it('should show custom error message on failure', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() =>
        useClipboard({ errorMessage: 'Oops! Could not copy' })
      );

      await act(async () => {
        await result.current.copy('test');
      });

      expect(toast.error).toHaveBeenCalledWith('Oops! Could not copy');
    });

    it('should handle empty string', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('');
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
      expect(result.current.copied).toBe(true);
    });

    it('should handle multiple copy calls', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('first');
      });

      expect(result.current.copied).toBe(true);

      await act(async () => {
        await result.current.copy('second');
      });

      expect(mockClipboard.writeText).toHaveBeenCalledTimes(2);
      expect(mockClipboard.writeText).toHaveBeenNthCalledWith(1, 'first');
      expect(mockClipboard.writeText).toHaveBeenNthCalledWith(2, 'second');
    });
  });
});

describe('useMultiClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with empty copiedItems', () => {
      const { result } = renderHook(() => useMultiClipboard());

      expect(result.current.copiedItems).toEqual({});
    });
  });

  describe('copy function', () => {
    it('should copy text and track by numeric key', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useMultiClipboard());

      await act(async () => {
        await result.current.copy('Item 0', 0);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith('Item 0');
      expect(result.current.copiedItems[0]).toBe(true);
    });

    it('should copy text and track by string key', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useMultiClipboard());

      await act(async () => {
        await result.current.copy('Command text', 'cmd-1');
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith('Command text');
      expect(result.current.copiedItems['cmd-1']).toBe(true);
    });

    it('should handle multiple items independently', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMultiClipboard());

      await act(async () => {
        await result.current.copy('First', 0);
      });

      await act(async () => {
        await result.current.copy('Second', 1);
      });

      await act(async () => {
        await result.current.copy('Third', 'custom-key');
      });

      expect(result.current.copiedItems[0]).toBe(true);
      expect(result.current.copiedItems[1]).toBe(true);
      expect(result.current.copiedItems['custom-key']).toBe(true);
    });

    it('should reset specific item after default delay', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMultiClipboard());

      await act(async () => {
        await result.current.copy('Item', 0);
      });

      expect(result.current.copiedItems[0]).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.copiedItems[0]).toBeUndefined();
    });

    it('should reset specific item after custom delay', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMultiClipboard({ resetDelay: 3000 }));

      await act(async () => {
        await result.current.copy('Item', 'key1');
      });

      expect(result.current.copiedItems['key1']).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(2999);
      });
      expect(result.current.copiedItems['key1']).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.copiedItems['key1']).toBeUndefined();
    });

    it('should reset items independently', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMultiClipboard({ resetDelay: 2000 }));

      // Copy first item
      await act(async () => {
        await result.current.copy('First', 0);
      });

      // Wait 1 second
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Copy second item
      await act(async () => {
        await result.current.copy('Second', 1);
      });

      expect(result.current.copiedItems[0]).toBe(true);
      expect(result.current.copiedItems[1]).toBe(true);

      // Wait 1 more second (total 2s from first copy)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // First item should be reset, second still copied
      expect(result.current.copiedItems[0]).toBeUndefined();
      expect(result.current.copiedItems[1]).toBe(true);

      // Wait 1 more second (total 2s from second copy)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Both should be reset
      expect(result.current.copiedItems[0]).toBeUndefined();
      expect(result.current.copiedItems[1]).toBeUndefined();
    });

    it('should show success toast with default message', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useMultiClipboard());

      await act(async () => {
        await result.current.copy('test', 0);
      });

      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });

    it('should show custom success message', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useMultiClipboard({ successMessage: 'Item copied!' })
      );

      await act(async () => {
        await result.current.copy('test', 'key');
      });

      expect(toast.success).toHaveBeenCalledWith('Item copied!');
    });

    it('should handle copy failure', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Failed'));

      const { result } = renderHook(() => useMultiClipboard());

      await act(async () => {
        await result.current.copy('test', 0);
      });

      expect(result.current.copiedItems[0]).toBeUndefined();
      expect(toast.error).toHaveBeenCalledWith('Failed to copy to clipboard');
    });

    it('should show custom error message on failure', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Failed'));

      const { result } = renderHook(() =>
        useMultiClipboard({ errorMessage: 'Copy failed!' })
      );

      await act(async () => {
        await result.current.copy('test', 'key');
      });

      expect(toast.error).toHaveBeenCalledWith('Copy failed!');
    });

    it('should handle overwriting same key', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMultiClipboard());

      await act(async () => {
        await result.current.copy('First', 'same-key');
      });

      await act(async () => {
        await result.current.copy('Second', 'same-key');
      });

      expect(result.current.copiedItems['same-key']).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(2);
    });
  });
});
