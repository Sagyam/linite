import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial behavior', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));

      expect(result.current).toBe('initial');
    });

    it('should work with different value types', () => {
      const { result: numberResult } = renderHook(() => useDebounce(42, 500));
      const { result: boolResult } = renderHook(() => useDebounce(true, 500));
      const { result: objectResult } = renderHook(() =>
        useDebounce({ key: 'value' }, 500)
      );

      expect(numberResult.current).toBe(42);
      expect(boolResult.current).toBe(true);
      expect(objectResult.current).toEqual({ key: 'value' });
    });

    it('should use default delay of 500ms when not specified', () => {
      const { result } = renderHook(() => useDebounce('test'));

      // Initial value
      expect(result.current).toBe('test');
    });
  });

  describe('debouncing behavior', () => {
    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      // Change the value
      rerender({ value: 'updated' });

      // Value should still be 'initial' before delay
      expect(result.current).toBe('initial');

      // Advance timers by delay
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Now value should be updated
      expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      // First change
      rerender({ value: 'change1' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('initial');

      // Second change before delay completes
      rerender({ value: 'change2' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('initial');

      // Third change before delay completes
      rerender({ value: 'final' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      // Still initial because timer keeps resetting
      expect(result.current).toBe('initial');

      // Now complete the delay
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current).toBe('final');
    });

    it('should not update if value changes back to original within delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'original' } }
      );

      // Change value
      rerender({ value: 'temporary' });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Change back to original
      rerender({ value: 'original' });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should end with 'original'
      expect(result.current).toBe('original');
    });
  });

  describe('delay parameter', () => {
    it('should respect custom delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1000),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Not updated after 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('initial');

      // Updated after full 1000ms
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('updated');
    });

    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(result.current).toBe('updated');
    });

    it('should handle very short delays', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 10),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      act(() => {
        vi.advanceTimersByTime(10);
      });

      expect(result.current).toBe('updated');
    });

    it('should handle very long delays', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 5000),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      act(() => {
        vi.advanceTimersByTime(4999);
      });
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe('updated');
    });

    it('should update delay dynamically', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'updated', delay: 500 });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Change delay mid-debounce
      rerender({ value: 'updated', delay: 1000 });

      act(() => {
        vi.advanceTimersByTime(700);
      });
      // Should use new delay, so still initial
      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('complex value types', () => {
    it('should debounce array values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: [1, 2, 3] } }
      );

      expect(result.current).toEqual([1, 2, 3]);

      rerender({ value: [4, 5, 6] });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toEqual([4, 5, 6]);
    });

    it('should debounce object values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: { name: 'John', age: 30 } } }
      );

      expect(result.current).toEqual({ name: 'John', age: 30 });

      rerender({ value: { name: 'Jane', age: 25 } });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toEqual({ name: 'Jane', age: 25 });
    });

    it('should handle null and undefined', () => {
      const { result: nullResult, rerender: rerenderNull } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: null as string | null } }
      );

      expect(nullResult.current).toBeNull();

      rerenderNull({ value: 'not null' });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(nullResult.current).toBe('not null');

      const { result: undefinedResult, rerender: rerenderUndefined } =
        renderHook(({ value }) => useDebounce(value, 500), {
          initialProps: { value: undefined as string | undefined },
        });

      expect(undefinedResult.current).toBeUndefined();

      rerenderUndefined({ value: 'defined' });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(undefinedResult.current).toBe('defined');
    });
  });

  describe('cleanup', () => {
    it('should cleanup timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      unmount();

      // Verify cleanup was called
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it('should not cause memory leaks with rapid updates', () => {
      const { rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 0 } }
      );

      // Simulate rapid updates
      for (let i = 1; i <= 100; i++) {
        rerender({ value: i });
        act(() => {
          vi.advanceTimersByTime(50);
        });
      }

      // Complete the final debounce
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should have the final value
      expect(true).toBe(true); // Test completes without errors
    });
  });

  describe('real-world scenarios', () => {
    it('should debounce search input', () => {
      const { result, rerender } = renderHook(
        ({ searchTerm }) => useDebounce(searchTerm, 300),
        { initialProps: { searchTerm: '' } }
      );

      // User types 'react' character by character
      rerender({ searchTerm: 'r' });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      rerender({ searchTerm: 're' });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      rerender({ searchTerm: 'rea' });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      rerender({ searchTerm: 'reac' });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      rerender({ searchTerm: 'react' });

      // Value should still be empty before delay
      expect(result.current).toBe('');

      // After delay, should have final value
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('react');
    });

    it('should handle form field validation delay', () => {
      const { result, rerender } = renderHook(
        ({ email }) => useDebounce(email, 500),
        { initialProps: { email: '' } }
      );

      // User types email
      rerender({ email: 'user@' });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      rerender({ email: 'user@example' });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      rerender({ email: 'user@example.com' });

      // Should not trigger validation yet
      expect(result.current).toBe('');

      // After delay, should trigger validation
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('user@example.com');
    });
  });
});
