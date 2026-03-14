# Testing

Tests use Vitest + React Testing Library. Tests are co-located with source files (`*.test.ts`).

## Commands

```bash
bun test              # Watch mode
bun test:run          # Run once
bun test:coverage     # With coverage
bun test:ui           # Interactive UI
```

### By Category

```bash
bun test:components   # UI/Component tests
bun test:logic        # Hooks, lib, services, stores
bun test:validation   # Zod schemas
bun test:apis         # External API clients
```

### Single File

```bash
bunx vitest run src/lib/format.test.ts
```

## Test Utilities

Located in `/src/test/component-utils.tsx`:

```typescript
import {
  renderWithProviders,
  createMockApp,
  createMockDistro,
  resetStores,
} from '@/test/component-utils';

// Reset stores before each test
beforeEach(() => resetStores());

// Render with providers
renderWithProviders(<MyComponent app={createMockApp()} />);
```

## Coverage

Target: 70%+ overall. Current: ~40%.

Priority areas:
- Validation schemas (target: 100%)
- Utility functions (target: 100%)
- API middleware and services (target: 90%)