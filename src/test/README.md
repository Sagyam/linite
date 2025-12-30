# Linite Test Suite

This directory contains the unit test configuration and setup for the Linite project.

## Overview

The Linite project uses **Vitest** as its testing framework, providing fast and modern unit testing for TypeScript/JavaScript code.

## Test Coverage

### Tested Components

#### 1. **External API Clients** (`src/services/external-apis/`)
- ✅ **SimpleCache** - 20 tests covering TTL expiration, cleanup, and edge cases
- ✅ **Flathub Client** - 21 tests covering search, metadata fetching, caching, and error handling
- ✅ **AUR Client** - 19 tests covering search, metadata, bulk operations, and package availability
- ✅ **Snapcraft Client** - 20 tests covering search, metadata, channel handling, and media extraction
- ✅ **Repology Client** - 26 tests covering project lookup, distro filtering, and repository mapping

#### 2. **Business Logic** (`src/services/`)
- ✅ **Command Generator** - 10 tests covering command generation, source prioritization, warnings, and grouping logic

#### 3. **State Management** (`src/stores/`)
- ✅ **Selection Store (Zustand)** - 35 tests covering app selection, distro selection, source preferences, persistence, and localStorage serialization

#### 4. **API Utilities** (`src/lib/`)
- ✅ **API Utils** - 32 tests covering rate limiting, auth, error handling, and middleware

#### 5. **Custom Hooks** (`src/hooks/`)
- ✅ **Clipboard Hooks** - 22 tests covering single and multi-item clipboard operations

#### 6. **Utility Functions** (`src/lib/`)
- ✅ **CN Utility** - 17 tests covering className merging and Tailwind conflict resolution

#### 7. **Refresh Strategies** (`src/services/refresh-strategies/`)
- ✅ **Strategy Registry** - 4 tests covering strategy lookup and registration
- ✅ **Flathub Strategy** - 7 tests covering strategy implementation

**Total: 239 passing tests**

## Running Tests

### Available Commands

```bash
# Run tests in watch mode (interactive)
bun test

# Run tests once and exit
bun test:run

# Run tests with UI
bun test:ui

# Run tests with coverage report
bun test:coverage
```

### Test Structure

Tests are co-located with their source files using the `.test.ts` naming convention:

```
src/
├── services/
│   ├── command-generator.ts
│   ├── command-generator.test.ts
│   └── external-apis/
│       ├── types.ts
│       ├── types.test.ts
│       ├── flathub.ts
│       └── flathub.test.ts
└── stores/
    ├── selection-store.ts
    └── selection-store.test.ts
```

## Test Configuration

### `vitest.config.ts`

- **Environment**: `happy-dom` (lightweight DOM implementation)
- **Globals**: Enabled for convenient `describe`, `it`, `expect` usage
- **Setup Files**: `src/test/setup.ts` for global test configuration
- **Coverage**: Configured to exclude Next.js app routes and React components (use integration tests for those)

### `src/test/setup.ts`

- Imports `@testing-library/jest-dom` for DOM assertions
- Sets up automatic cleanup after each test
- Clears all mocks between tests
- Sets `NODE_ENV=test`

## Writing Tests

### Best Practices

1. **Mock External Dependencies**: Use `vi.mock()` to mock database calls, API requests, etc.
   ```typescript
   vi.mock('@/db', () => ({
     db: { query: { ... } }
   }));
   ```

2. **Clear Mocks**: Always clear mocks in `beforeEach` or `afterEach`
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

3. **Test Edge Cases**: Cover happy paths, error cases, and edge cases
   - Empty inputs
   - Invalid data
   - Network failures
   - Cache hits/misses

4. **Descriptive Test Names**: Use clear, action-oriented test names
   ```typescript
   it('should generate commands for multiple apps with different sources', async () => {
     // test implementation
   });
   ```

5. **Arrange-Act-Assert Pattern**: Structure tests clearly
   ```typescript
   // Arrange: Set up mocks and test data
   const mockData = { ... };
   vi.mock(...);

   // Act: Execute the code under test
   const result = await functionToTest();

   // Assert: Verify the results
   expect(result).toEqual(expected);
   ```

## Test Examples

### Testing API Clients

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchFlathub } from './flathub';

global.fetch = vi.fn();

describe('Flathub API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search for apps successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hits: [...] }),
    });

    const results = await searchFlathub('firefox');

    expect(results).toHaveLength(1);
    expect(results[0].identifier).toBe('org.mozilla.firefox');
  });
});
```

### Testing State Management

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from './selection-store';

describe('Selection Store', () => {
  beforeEach(() => {
    useSelectionStore.getState().reset();
  });

  it('should add app to selection', () => {
    const { selectApp } = useSelectionStore.getState();

    selectApp('app-1');

    const state = useSelectionStore.getState();
    expect(state.selectedApps.has('app-1')).toBe(true);
  });
});
```

### Testing Business Logic

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateInstallCommands } from './command-generator';

vi.mock('@/db');

describe('Command Generator', () => {
  it('should generate install commands', async () => {
    // Mock database responses
    (db.query.distros.findFirst as any).mockResolvedValue({ ... });
    (db.query.apps.findMany as any).mockResolvedValue([ ... ]);

    const result = await generateInstallCommands({
      distroSlug: 'ubuntu',
      appIds: ['app-1'],
    });

    expect(result.commands).toContain('sudo apt install -y firefox');
  });
});
```

## Future Test Expansion

The following areas could benefit from additional test coverage:

### High Priority
- **AUR API Client** - Search, metadata, bulk operations
- **Snapcraft API Client** - Search, package info, channel handling
- **Repology API Client** - Project lookup, distro filtering
- **API Utilities** (`src/lib/api-utils.ts`) - Rate limiting, auth, error handling

### Medium Priority
- **Package Refresh Service** - Refresh workflow, strategy selection
- **Refresh Strategies** - Strategy contract compliance
- **Custom React Hooks** - Data fetching, error handling

### Lower Priority
- **Utility Functions** - Helper functions, constants
- **Components** - Consider integration/E2E tests instead

## Coverage Goals

Current coverage focuses on:
- ✅ Core business logic (command generation)
- ✅ Data layer utilities (caching)
- ✅ State management (Zustand stores)
- ✅ External API integrations

Target coverage: **80%+ for business logic and services**

## Continuous Integration

Tests should be run in CI/CD pipelines before deployment:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: bun test:run

- name: Generate coverage
  run: bun test:coverage
```

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in test or config
   ```typescript
   it('slow test', async () => { ... }, 10000); // 10 second timeout
   ```

2. **Mock not working**: Ensure `vi.clearAllMocks()` is called
3. **Database mock errors**: Verify mock structure matches query API
4. **LocalStorage errors**: Check that `happy-dom` environment is configured

### Debug Mode

Run tests with additional logging:

```bash
DEBUG=* bun test:run
```

Or add debug statements in tests:

```typescript
console.log('Current state:', useSelectionStore.getState());
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
