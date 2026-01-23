# E2E Testing Setup - Stage 0

**Status**: ✅ Complete
**Completed**: 2026-01-23
**Implemented by**: Claude Sonnet 4.5

---

## Overview

This directory contains all end-to-end (E2E) tests for the Linite project using Playwright. The tests are organized into 5 stages, each covering different aspects of the application.

## Stage 0: Setup & Configuration (COMPLETE)

Stage 0 establishes the foundation for E2E testing:

### What Was Implemented

1. **Playwright Installation**
   - Installed `@playwright/test@1.58.0`
   - Installed browser binaries: Chromium, Firefox, WebKit
   - Installed `dotenv` for environment variable management

2. **Configuration Files**
   - `playwright.config.ts` - Playwright configuration with browser projects
   - `.env.test` - Test environment variables (separate from production)

3. **Directory Structure**
   ```
   tests/
   ├── e2e/
   │   ├── stage-1/     # Core user flows
   │   ├── stage-2/     # Search & navigation
   │   ├── stage-3/     # Admin interface
   │   ├── stage-4/     # Advanced features
   │   └── stage-5/     # API & integration
   ├── fixtures/        # Test data
   │   ├── base-fixtures.ts
   │   └── seed.ts
   ├── helpers/         # Test utilities
   │   ├── test-helpers.ts
   │   ├── auth-helpers.ts
   │   ├── command-helpers.ts
   │   ├── api-helpers.ts
   │   └── db-helpers.ts
   └── mocks/           # Mock data
       ├── external-apis/
       └── api-responses/
   ```

4. **Helper Utilities**
   - **test-helpers.ts**: Common utilities (navigation, waiting, clipboard)
   - **auth-helpers.ts**: Authentication flows (login, logout, token management)
   - **command-helpers.ts**: Command validation (APT, DNF, Flatpak, etc.)
   - **api-helpers.ts**: API testing utilities (requests, validation)
   - **db-helpers.ts**: Database management (seeding, cleanup)

5. **Test Fixtures**
   - Base fixtures with sample data (categories, distros, sources, apps, packages)
   - Seed functions for populating test database
   - Cleanup functions for test isolation

6. **NPM Scripts**
   - `test:e2e` - Run all E2E tests
   - `test:e2e:ui` - Run tests in interactive UI mode
   - `test:e2e:debug` - Run tests in debug mode
   - `test:e2e:headed` - Run tests with visible browser
   - `test:e2e:chromium` - Run tests only in Chromium
   - `test:e2e:firefox` - Run tests only in Firefox
   - `test:e2e:webkit` - Run tests only in WebKit
   - `test:e2e:mobile` - Run tests on mobile viewports
   - `test:e2e:stage-{1-5}` - Run tests for specific stage
   - `test:e2e:report` - Show HTML test report

7. **Updated .gitignore**
   - Added test artifacts to gitignore:
     - `/test-results/`
     - `/playwright-report/`
     - `test.db*`
     - `.env.test.local`

---

## Quick Start

### Running Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run with visible browser (helpful for debugging)
bun run test:e2e:headed

# Run in interactive UI mode
bun run test:e2e:ui

# Run specific stage
bun run test:e2e:stage-1

# Run only Chromium tests
bun run test:e2e:chromium
```

### Debugging Tests

```bash
# Run in debug mode (pauses at breakpoints)
bun run test:e2e:debug

# Run specific test file
bun run test:e2e tests/e2e/stage-1/app-selection.spec.ts

# Show test report
bun run test:e2e:report
```

---

## Test Stages

### Stage 1: Core User Flows (PENDING)
**Priority**: CRITICAL
**Tests**: 15-20
**Focus**: App selection, distro selection, command generation

### Stage 2: Search, Filter & Navigation (PENDING)
**Priority**: HIGH
**Tests**: 20-25
**Focus**: Search, categories, infinite scroll, keyboard navigation

### Stage 3: Admin Interface (PENDING)
**Priority**: HIGH
**Tests**: 25-30
**Focus**: Authentication, CRUD operations, package management

### Stage 4: Advanced Features & Edge Cases (PENDING)
**Priority**: MEDIUM
**Tests**: 20-25
**Focus**: Collections, installation history, responsive design

### Stage 5: API Routes & Integration (PENDING)
**Priority**: MEDIUM
**Tests**: 15-20
**Focus**: API endpoints, validation, performance

---

## Helper Utilities Reference

### TestHelpers

```typescript
import { TestHelpers } from '@/tests/helpers/test-helpers';

// Reset app state
await TestHelpers.resetAppState(page);

// Wait for network idle
await TestHelpers.waitForNetworkIdle(page);

// Take debug screenshot
await TestHelpers.takeDebugScreenshot(page, 'error-state');

// Fill form field by label
await TestHelpers.fillFieldByLabel(page, 'Email', 'test@example.com');

// Click button by name
await TestHelpers.clickButton(page, 'Submit');
```

### AuthHelpers

```typescript
import { AuthHelpers } from '@/tests/helpers/auth-helpers';

// Login as admin
await AuthHelpers.login(page);

// Logout
await AuthHelpers.logout(page);

// Check authentication status
const isAuth = await AuthHelpers.isAuthenticated(page);

// Mock authentication (bypass login)
await AuthHelpers.mockAuthentication(page);
```

### CommandHelpers

```typescript
import { CommandHelpers } from '@/tests/helpers/command-helpers';

// Validate command syntax
const isValid = CommandHelpers.validateAptCommand('sudo apt install firefox');

// Extract package names
const packages = CommandHelpers.extractPackageNames(command);

// Check if command contains specific package
const hasPackage = CommandHelpers.containsPackage(command, 'firefox');

// Parse command into components
const parsed = CommandHelpers.parseCommand(command);
```

### ApiHelpers

```typescript
import { ApiHelpers } from '@/tests/helpers/api-helpers';

// Make authenticated API request
const response = await ApiHelpers.authenticatedRequest(
  request,
  '/api/apps',
  { method: 'GET' }
);

// Validate response
await ApiHelpers.validateSuccess(response);
const data = await ApiHelpers.parseJson(response);

// Generate install command
const result = await ApiHelpers.generateInstallCommand(
  request,
  ['firefox', 'vlc'],
  'ubuntu-22-04'
);
```

### DbHelpers

```typescript
import { DbHelpers } from '@/tests/helpers/db-helpers';

// Clean database
await DbHelpers.cleanDatabase();

// Seed basic test data
const { app, distro, source } = await DbHelpers.seedBasicData();

// Create test app
const app = await DbHelpers.createTestApp({
  name: 'Test App',
  slug: 'test-app',
  categoryId: 'browsers',
});

// Get app by ID
const app = await DbHelpers.getAppById('firefox');
```

---

## Test Fixtures

### Using Base Fixtures

```typescript
import { baseFixtures } from '@/tests/fixtures/base-fixtures';

// Use predefined fixtures
const firefox = baseFixtures.apps.firefox;
const ubuntu = baseFixtures.distros.ubuntu;
const apt = baseFixtures.sources.apt;

// Create test data with overrides
import { createTestApp } from '@/tests/fixtures/base-fixtures';

const customApp = createTestApp({
  name: 'My Test App',
  categoryId: 'development',
});
```

### Seeding Test Database

```typescript
import { seedTestData, cleanupTestData } from '@/tests/fixtures/seed';

// Before tests
test.beforeAll(async () => {
  await seedTestData('minimal'); // or 'full'
});

// After tests
test.afterAll(async () => {
  await cleanupTestData();
});
```

---

## Environment Configuration

### Test Environment Variables (.env.test)

- **NODE_ENV**: `test`
- **DATABASE_URL**: `file:./test.db` (local SQLite)
- **BETTER_AUTH_SECRET**: Test auth secret
- **TEST_ADMIN_EMAIL**: `admin@test.linite.com`
- **TEST_ADMIN_PASSWORD**: `TestPassword123!`
- **ENABLE_EXTERNAL_API_CALLS**: `false` (use mocks)

### Important Notes

- Test database is separate from development database
- External API calls are disabled by default (use mocks)
- OAuth credentials are test values (won't work in production)

---

## Best Practices

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

/**
 * Test Suite: Feature Name
 * Stage: [1-5]
 * Priority: [CRITICAL/HIGH/MEDIUM/LOW]
 */
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: runs before each test
    await page.goto('/');
  });

  test('should do something specific', async ({ page }) => {
    // Arrange: Set up test conditions
    const button = page.getByRole('button', { name: 'Click Me' });

    // Act: Perform action
    await button.click();

    // Assert: Verify result
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Selector Priority

1. **Role + Name** (BEST): `page.getByRole('button', { name: 'Submit' })`
2. **Label**: `page.getByLabel('Email')`
3. **Placeholder**: `page.getByPlaceholder('Search...')`
4. **Test ID**: `page.getByTestId('app-card')`
5. **Text**: `page.getByText('Hello')`
6. **CSS** (AVOID): `page.locator('.class-name')`

### Assertions

```typescript
// Always use await with assertions
await expect(element).toBeVisible();
await expect(element).toHaveText('Expected text');
await expect(page).toHaveURL(/pattern/);

// Add descriptive messages for failures
await expect(button, 'Submit button should be enabled after form fill')
  .toBeEnabled();
```

---

## Troubleshooting

### Common Issues

#### Tests failing with "Target closed"
- **Cause**: Browser closed unexpectedly
- **Fix**: Check for unhandled errors, increase timeout

#### "Element not found" errors
- **Cause**: Element not yet rendered or wrong selector
- **Fix**: Add proper waits, verify selector

#### Flaky tests
- **Cause**: Race conditions, network delays
- **Fix**: Use proper waits, avoid hardcoded timeouts

#### Database errors
- **Cause**: Test database not cleaned between runs
- **Fix**: Use `cleanupTestData()` in `afterAll` hooks

### Debug Commands

```bash
# Run with visible browser
bun run test:e2e:headed

# Run in debug mode (step through)
bun run test:e2e:debug

# Show test traces
bunx playwright show-trace test-results/trace.zip

# Generate report
bun run test:e2e:report
```

---

## Next Steps

1. **Start Stage 1**: Implement core user flow tests
   - App selection tests
   - Command generation tests
   - Distro selection tests

2. **Review Test Plan**: See `/docs/E2E_TESTING_PLAN.md` for full details

3. **Set Up CI/CD**: Add GitHub Actions workflow for E2E tests

---

## Resources

- **Playwright Docs**: https://playwright.dev
- **Test Plan**: `/docs/E2E_TESTING_PLAN.md`
- **Project Documentation**: `/docs/`

---

## Status Summary

✅ **Stage 0: COMPLETE** (Setup & Configuration)
⏳ **Stage 1: PENDING** (Core User Flows)
⏳ **Stage 2: PENDING** (Search & Navigation)
⏳ **Stage 3: PENDING** (Admin Interface)
⏳ **Stage 4: PENDING** (Advanced Features)
⏳ **Stage 5: PENDING** (API & Integration)

**Total Progress**: 0/~90 tests implemented
