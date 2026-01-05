# Testing Guide for Linite

This document provides comprehensive guidance on testing in the Linite project.

## Table of Contents
- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Utilities](#test-utilities)
- [Coverage Goals](#coverage-goals)
- [Best Practices](#best-practices)

## Overview

Linite uses a modern testing stack with Vitest and React Testing Library to ensure code quality and enable confident refactoring.

**Current Test Coverage**: 39.6% overall (569 tests)
- Statement Coverage: 39.6%
- Branch Coverage: 38.02%
- Function Coverage: 29.44%

## Testing Stack

### Core Libraries
- **[Vitest](https://vitest.dev/)** - Fast unit test framework (v4.0.16)
- **[React Testing Library](https://testing-library.com/react)** - Component testing (@testing-library/react 16.3.1)
- **[happy-dom](https://github.com/capricorn86/happy-dom)** - Lightweight DOM implementation
- **[@vitest/coverage-v8](https://vitest.dev/guide/coverage)** - Code coverage reports

### Additional Tools
- **[@testing-library/jest-dom](https://github.com/testing-library/jest-dom)** - Custom DOM matchers
- **[@testing-library/user-event](https://testing-library.com/docs/user-event/intro/)** - User interaction simulation

## Running Tests

### Basic Commands

```bash
# Run all tests in watch mode
bun test

# Run all tests once
bun test:run
# or
bun test:all

# Run with coverage report
bun test:coverage

# Run tests with UI
bun test:ui

# Watch mode (re-run on file changes)
bun test:watch
```

### Category-Specific Tests

```bash
# UI/Component tests only
bun test:components
# or
bun test:ui-only

# Logic/Unit tests (hooks, lib, services, stores)
bun test:logic

# Hooks tests only
bun test:hooks

# Library/utility tests only
bun test:lib

# Service tests only
bun test:services

# Validation schema tests only
bun test:validation

# External API tests only
bun test:apis
```

### Running Specific Tests

```bash
# Run a single test file
bunx vitest run src/components/app-card.test.tsx

# Run all tests in a directory
bunx vitest run src/lib/validation/schemas/

# Run tests matching a pattern
bunx vitest run --grep "validation"
```

**Important**: Use `bunx vitest run` instead of `bun test` for component tests, as `bun test` doesn't properly load the DOM environment.

## Writing Tests

### File Organization

Tests are co-located with source files:
```
src/
  components/
    app-card.tsx
    app-card.test.tsx          # Component test
  lib/
    format.ts
    format.test.ts             # Utility test
  hooks/
    use-debounce.ts
    use-debounce.test.ts       # Hook test
```

### Test Structure

Follow the AAA pattern (Arrange, Act, Assert):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyComponent or Function', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('specific functionality', () => {
    it('should do X when Y happens', () => {
      // Arrange - Set up test data and state
      const input = createMockData();

      // Act - Execute the code under test
      const result = functionUnderTest(input);

      // Assert - Verify the results
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

### Component Testing

Use the custom `renderWithProviders` utility for components:

```typescript
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import {
  renderWithProviders,
  createMockApp,
  resetStores,
} from '@/test/component-utils';
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  beforeEach(() => {
    resetStores(); // Reset Zustand stores
  });

  it('should render correctly', () => {
    const mockApp = createMockApp({ displayName: 'Test App' });

    renderWithProviders(<MyComponent app={mockApp} />);

    expect(screen.getByText('Test App')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    renderWithProviders(<MyComponent />);

    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);

    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });
});
```

### Hook Testing

Test custom hooks with `renderHook`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './use-my-hook';

describe('useMyHook', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useMyHook());

    expect(result.current.value).toBe(defaultValue);
  });

  it('should update value on action', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.setValue('new value');
    });

    expect(result.current.value).toBe('new value');
  });
});
```

### Validation Schema Testing

Test Zod schemas thoroughly:

```typescript
import { describe, it, expect } from 'vitest';
import { mySchema } from './my-schema';
import { ZodError } from 'zod';

describe('mySchema', () => {
  it('should validate valid input', () => {
    const valid = { field: 'value' };
    const result = mySchema.parse(valid);
    expect(result).toEqual(valid);
  });

  it('should reject invalid input', () => {
    const invalid = { field: 123 }; // expecting string
    expect(() => mySchema.parse(invalid)).toThrow(ZodError);
  });

  it('should apply defaults', () => {
    const result = mySchema.parse({});
    expect(result.fieldWithDefault).toBe('default value');
  });
});
```

### API Client Testing

Mock `fetch` for external API clients:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchAPI, clearCache } from './api-client';

global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
  });

  it('should fetch and parse results', async () => {
    const mockResponse = { results: [{ id: 1, name: 'Item' }] };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const results = await searchAPI('query');

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Item');
  });

  it('should handle errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const results = await searchAPI('query');

    expect(results).toEqual([]);
  });
});
```

## Test Utilities

### Component Utilities (`/src/test/component-utils.tsx`)

Comprehensive utilities for testing React components:

#### Mock Data Factories

Create realistic test data easily:

```typescript
import {
  createMockApp,
  createMockCategory,
  createMockDistro,
  createMockSource,
  createMockPackage,
  createMockAppWithRelations,
} from '@/test/component-utils';

// Create single mock
const app = createMockApp({ displayName: 'Custom Name' });

// Create multiple mocks
const apps = createMockApps(5, { isFoss: true });

// Create with relations
const appWithPackages = createMockAppWithRelations({
  displayName: 'Firefox',
  packages: [createMockPackageWithRelations()],
});
```

#### Custom Render Function

Wraps components with necessary providers:

```typescript
import { renderWithProviders } from '@/test/component-utils';

const { getByText, queryByRole } = renderWithProviders(<MyComponent />);
```

#### Store Utilities

Manage Zustand store state in tests:

```typescript
import { resetStores, setupSelectionStore } from '@/test/component-utils';

// Reset all stores before each test
beforeEach(() => {
  resetStores();
});

// Pre-populate store for testing
setupSelectionStore({
  apps: ['app-1', 'app-2'],
  distro: 'ubuntu',
  sourcePreference: 'flatpak',
});
```

#### Mock Utilities

Mock global APIs:

```typescript
import {
  mockGlobalFetch,
  mockApiSuccess,
  mockApiError,
  mockClipboard,
} from '@/test/component-utils';

// Mock fetch
const mockFetch = mockGlobalFetch();
mockFetch.mockResolvedValueOnce(mockApiSuccess({ data: [...] }));

// Mock clipboard
const { writeText } = mockClipboard();
```

### Setup File (`/src/test/setup.ts`)

Global test configuration:
- Extends Vitest matchers with jest-dom
- Mocks `localStorage` for Zustand persist
- Cleans up after each test

## Coverage Goals

### Overall Targets
- **Target**: 70%+ overall coverage
- **Current**: 39.6% overall coverage
- **Progress**: +5.1% from baseline (34.5%)

### High Priority (Should be >90%)
- ✅ **Validation schemas**: 61.5% → Target: 100%
- ✅ **Utility functions**: 100%
- ✅ **External API clients**: 59.7% → Target: 95%+
- ❌ **API middleware**: 0% → Target: 95%
- ❌ **Services**: 59.7% → Target: 90%

### Medium Priority (Should be >70%)
- ❌ **API routes**: 0% → Target: 80%
- ❌ **Repositories**: 0% → Target: 75%
- ✅ **Stores**: 87.5%

### Acceptable Lower Coverage
- **Components**: Excluded from coverage (use integration tests)
- **App router files**: Excluded
- **Type definitions**: Excluded

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**: Testing internal state
```typescript
expect(component.state.count).toBe(1);
```

✅ **Good**: Testing user-visible behavior
```typescript
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 2. Use Descriptive Test Names

❌ **Bad**: Vague test name
```typescript
it('works', () => { ... });
```

✅ **Good**: Clear, specific test name
```typescript
it('should display error message when form submission fails', () => { ... });
```

### 3. Follow AAA Pattern

Always structure tests with clear sections:
- **Arrange**: Set up test data and state
- **Act**: Execute the code under test
- **Assert**: Verify the results

### 4. Test Edge Cases

Don't just test the happy path:
- Empty states
- Null/undefined values
- Maximum/minimum values
- Error conditions
- Loading states

### 5. Keep Tests Independent

Each test should be able to run in isolation:
- Use `beforeEach` to reset state
- Don't rely on test execution order
- Clean up after tests (timers, mocks, etc.)

### 6. Use Appropriate Queries

React Testing Library query priority:
1. `getByRole` - Best for accessibility
2. `getByLabelText` - Form fields
3. `getByText` - Text content
4. `getByTestId` - Last resort

### 7. Avoid Implementation Details

❌ **Bad**: Testing class names or internal structure
```typescript
expect(element).toHaveClass('some-internal-class');
```

✅ **Good**: Testing user-perceivable behavior
```typescript
expect(button).toBeDisabled();
```

### 8. Mock External Dependencies

Always mock:
- API calls (`fetch`, axios)
- Browser APIs (`localStorage`, `clipboard`)
- External services
- Database calls

### 9. Test Accessibility

Include accessibility checks in component tests:
```typescript
expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
expect(input).toHaveAccessibleName('Email address');
```

### 10. Use Coverage as a Guide, Not a Goal

Coverage metrics help identify untested code, but:
- 100% coverage doesn't mean bug-free code
- Focus on testing important behavior
- Some code may not need tests (simple getters, constants)

## Common Testing Patterns

### Testing Async Behavior

```typescript
it('should load data asynchronously', async () => {
  renderWithProviders(<AsyncComponent />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  const content = await screen.findByText('Loaded content');
  expect(content).toBeInTheDocument();
});
```

### Testing User Interactions

```typescript
it('should toggle checkbox on click', async () => {
  const { user } = renderWithProviders(<CheckboxComponent />);

  const checkbox = screen.getByRole('checkbox');

  await user.click(checkbox);
  expect(checkbox).toBeChecked();

  await user.click(checkbox);
  expect(checkbox).not.toBeChecked();
});
```

### Testing Forms

```typescript
it('should submit form with valid data', async () => {
  const onSubmit = vi.fn();
  renderWithProviders(<Form onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
});
```

### Testing Error States

```typescript
it('should display error message on failure', async () => {
  mockFetch.mockRejectedValueOnce(new Error('API Error'));

  renderWithProviders(<Component />);

  const error = await screen.findByRole('alert');
  expect(error).toHaveTextContent('Failed to load data');
});
```

## Debugging Tests

### View Rendered HTML

```typescript
import { screen } from '@testing-library/react';

screen.debug(); // Prints entire DOM
screen.debug(screen.getByRole('button')); // Prints specific element
```

### Use Testing Playground

```typescript
import { screen } from '@testing-library/react';

screen.logTestingPlaygroundURL(); // Opens interactive query builder
```

### Run Tests in UI Mode

```bash
bun test:ui
```

Opens visual test runner with:
- Test results
- Coverage visualization
- Debugging tools

## Continuous Integration

Tests run automatically on:
- Every push to `main`
- Pull request creation
- Pull request updates

Ensure tests pass before merging:
```bash
bun test:run
```

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Writing Tests for React](https://react.dev/learn/testing)

---

**Last Updated**: January 2026
**Test Count**: 569 tests
**Coverage**: 39.6% overall
