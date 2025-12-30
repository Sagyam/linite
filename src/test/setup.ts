import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend Vitest's expect with jest-dom matchers
expect.extend({});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
