import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className utility)', () => {
  it('should merge single class name', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('should merge multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
  });

  it('should merge Tailwind conflicting classes correctly', () => {
    // twMerge should keep the last conflicting class
    expect(cn('px-2 px-4')).toBe('px-4');
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn(['foo'], 'bar', ['baz'])).toBe('foo bar baz');
  });

  it('should handle objects with conditional classes', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should filter out falsy values', () => {
    expect(cn('foo', null, undefined, false, '', 'bar')).toBe('foo bar');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });

  it('should handle complex Tailwind combinations', () => {
    // Merge responsive variants
    expect(cn('p-2 md:p-4 md:p-6')).toBe('p-2 md:p-6');

    // Merge hover states
    expect(cn('hover:bg-gray-100 hover:bg-blue-100')).toBe('hover:bg-blue-100');
  });

  it('should preserve non-conflicting classes', () => {
    expect(cn('flex items-center justify-between')).toBe('flex items-center justify-between');
  });

  it('should merge multiple sources with conflicts', () => {
    const baseClasses = 'px-4 py-2 bg-blue-500';
    const overrideClasses = 'px-6 bg-red-500';

    expect(cn(baseClasses, overrideClasses)).toBe('py-2 px-6 bg-red-500');
  });

  it('should handle undefined and null gracefully', () => {
    expect(cn('foo', undefined, 'bar', null)).toBe('foo bar');
  });

  it('should work with template literals', () => {
    const variant = 'primary';
    expect(cn(`btn btn-${variant}`)).toBe(`btn btn-${variant}`);
  });

  it('should handle mixed inputs', () => {
    expect(cn(
      'base-class',
      { conditional: true, notIncluded: false },
      ['array-class'],
      false && 'not-included',
      'final-class'
    )).toBe('base-class conditional array-class final-class');
  });
});
