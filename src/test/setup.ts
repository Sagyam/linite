import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend Vitest's expect with jest-dom matchers
expect.extend({});

// Suppress React act() warnings for external state manager updates (Zustand)
// These are false positives as the store updates are intentional and properly handled
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: Parameters<typeof console.error>) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('An update to TestComponent inside a test was not wrapped in act') ||
        args[0].includes('When testing, code that causes React state updates should be wrapped into act'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

// Mock localStorage with actual storage behavior
// Must be defined before any module imports that use localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
};

const localStorageMock = createLocalStorageMock();

// Define localStorage on both global and globalThis to ensure it's available
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
