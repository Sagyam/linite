# E2E Testing Plan - Linite Project

**Version**: 1.0
**Last Updated**: 2026-01-23
**Status**: Implementation Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Implementation Stages](#implementation-stages)
4. [Strict Guidelines & Requirements](#strict-guidelines--requirements)
5. [Test Categories](#test-categories)
6. [File Structure](#file-structure)
7. [Writing Standards](#writing-standards)
8. [CI/CD Integration](#cicd-integration)
9. [Maintenance Guidelines](#maintenance-guidelines)
10. [Test Templates](#test-templates)

---

## Overview

### Purpose
Implement comprehensive end-to-end testing for Linite using Playwright to cover critical user flows, API integrations, and admin operations that are currently untested (0% coverage for API routes and user flows).

### Scope
- **Total Tests Planned**: ~80-100 E2E tests across 5 stages
- **Execution Time Target**: < 10 minutes for full suite
- **Coverage Goals**:
  - 100% of critical user flows
  - 100% of API route handlers
  - 100% of admin CRUD operations
  - 90%+ of edge cases and error scenarios

### Success Criteria
1. All critical paths covered by at least 2 tests (happy path + edge case)
2. Tests run reliably in CI/CD (< 2% flakiness rate)
3. Clear test ownership and documentation
4. New features require E2E tests before merge

---

## Prerequisites & Setup

### Required Tools
- **Playwright**: `@playwright/test` (latest stable)
- **Node.js/Bun**: Project uses Bun (already installed)
- **Test Database**: SQLite for E2E tests (isolated from dev/prod)
- **Environment Variables**: Separate `.env.test` file

### Initial Setup (Stage 0 - REQUIRED BEFORE STAGE 1)

#### 1. Install Playwright
```bash
bun add --dev @playwright/test
bunx playwright install chromium firefox webkit
```

#### 2. Create Configuration File
**File**: `/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests/e2e',

  // Timeout configuration
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // Test execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporting
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Shared settings
  use: {
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },

  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Web server
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

#### 3. Create Test Environment File
**File**: `/.env.test`

```bash
# Copy from .env and modify for testing
NODE_ENV=test
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Test Database (separate from dev)
DATABASE_URL=file:./test.db
DATABASE_AUTH_TOKEN=

# Test Admin Credentials
TEST_ADMIN_EMAIL=admin@test.linite.com
TEST_ADMIN_PASSWORD=TestPassword123!

# Disable external API calls in tests (use mocks)
ENABLE_EXTERNAL_API_CALLS=false

# Azure Blob Storage (use test container or mock)
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=test-uploads

# Auth Configuration
BETTER_AUTH_SECRET=test-secret-key-for-e2e-tests
BETTER_AUTH_URL=http://localhost:3000
```

#### 4. Create Test Directory Structure
```bash
mkdir -p tests/e2e/{stage-1,stage-2,stage-3,stage-4,stage-5}
mkdir -p tests/fixtures
mkdir -p tests/helpers
mkdir -p tests/mocks
```

#### 5. Add NPM Scripts
**File**: `/package.json` (add to scripts section)

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:stage-1": "playwright test tests/e2e/stage-1",
    "test:e2e:stage-2": "playwright test tests/e2e/stage-2",
    "test:e2e:stage-3": "playwright test tests/e2e/stage-3",
    "test:e2e:stage-4": "playwright test tests/e2e/stage-4",
    "test:e2e:stage-5": "playwright test tests/e2e/stage-5",
    "test:e2e:report": "playwright show-report"
  }
}
```

#### 6. Update .gitignore
```bash
# Add to .gitignore
test-results/
playwright-report/
test.db
test.db-shm
test.db-wal
.env.test.local
```

---

## Implementation Stages

### Stage 1: Core User Flows (Priority: CRITICAL)
**Goal**: Cover the main user journey from app selection to command generation
**Estimated Tests**: 15-20
**Estimated Time**: 3-4 days
**Dependencies**: Stage 0 complete

#### Tests to Implement

1. **App Selection Flow** (`tests/e2e/stage-1/app-selection.spec.ts`)
   - [ ] Browse apps on homepage
   - [ ] Select single app
   - [ ] Select multiple apps
   - [ ] Deselect apps
   - [ ] Select all visible apps
   - [ ] Clear all selections
   - [ ] Selection persists across page navigation

2. **Command Generation - Basic** (`tests/e2e/stage-1/command-generation-basic.spec.ts`)
   - [ ] Generate command for single app (Ubuntu + apt)
   - [ ] Generate command for multiple apps (Ubuntu + apt)
   - [ ] Generate command with Flatpak source
   - [ ] Generate command with Snap source
   - [ ] Verify command syntax is correct
   - [ ] Verify setup commands are included

3. **Distro Selection** (`tests/e2e/stage-1/distro-selection.spec.ts`)
   - [ ] Select distro from dropdown
   - [ ] Switch between distros
   - [ ] Verify available sources change with distro
   - [ ] Distro preference persists (localStorage)

4. **Command Display & Copy** (`tests/e2e/stage-1/command-display.spec.ts`)
   - [ ] Commands display in correct format
   - [ ] Copy button works
   - [ ] Copy success notification appears
   - [ ] Multiple command groups display correctly
   - [ ] Setup commands display separately

5. **Error Handling - User Flows** (`tests/e2e/stage-1/error-handling-user.spec.ts`)
   - [ ] No apps selected shows warning
   - [ ] No distro selected shows warning
   - [ ] App unavailable for distro shows warning message
   - [ ] Network error shows appropriate error

**Acceptance Criteria**:
- ✅ All 15-20 tests pass on chromium
- ✅ Tests run in < 3 minutes
- ✅ No flaky tests (3 consecutive runs pass)
- ✅ Code review approved by 1+ developer

---

### Stage 2: Search, Filter & Navigation (Priority: HIGH)
**Goal**: Test search functionality, filtering, and UI navigation
**Estimated Tests**: 20-25
**Estimated Time**: 3-4 days
**Dependencies**: Stage 1 complete

#### Tests to Implement

1. **Search Functionality** (`tests/e2e/stage-2/search.spec.ts`)
   - [ ] Search by app name (exact match)
   - [ ] Search by app name (partial match)
   - [ ] Search is debounced (doesn't fire on every keystroke)
   - [ ] Search results update in real-time
   - [ ] Clear search resets results
   - [ ] Search with no results shows empty state
   - [ ] Search works with filters applied

2. **Category Filtering** (`tests/e2e/stage-2/category-filter.spec.ts`)
   - [ ] Filter by single category
   - [ ] Filter shows correct app count
   - [ ] Category filter works with search
   - [ ] Clear category filter
   - [ ] Multiple categories (if supported)

3. **View Modes** (`tests/e2e/stage-2/view-modes.spec.ts`)
   - [ ] Toggle between minimal/compact/detailed views
   - [ ] View preference persists
   - [ ] All views display app information correctly
   - [ ] Selection works in all view modes

4. **Infinite Scroll** (`tests/e2e/stage-2/infinite-scroll.spec.ts`)
   - [ ] Initial page loads 20-30 apps
   - [ ] Scrolling triggers next page load
   - [ ] Loading indicator appears during fetch
   - [ ] No duplicate apps appear
   - [ ] Scroll position maintained after selection

5. **Keyboard Navigation** (`tests/e2e/stage-2/keyboard-navigation.spec.ts`)
   - [ ] Arrow keys navigate between apps
   - [ ] Enter/Space toggles selection
   - [ ] Tab navigation works correctly
   - [ ] Keyboard shortcuts dialog opens (?)
   - [ ] Escape closes modals/dialogs

6. **Popular & Featured Apps** (`tests/e2e/stage-2/popular-featured.spec.ts`)
   - [ ] Popular apps filter works
   - [ ] Popular apps display in correct order
   - [ ] Popularity count displays correctly

**Acceptance Criteria**:
- ✅ All 20-25 tests pass on chromium
- ✅ Search performance < 500ms response time
- ✅ Infinite scroll handles 170+ apps without issues
- ✅ No memory leaks during scrolling (check with Playwright profiling)

---

### Stage 3: Admin Interface (Priority: HIGH)
**Goal**: Cover admin CRUD operations and authentication
**Estimated Tests**: 25-30
**Estimated Time**: 4-5 days
**Dependencies**: Stage 1 complete (Stage 2 can run in parallel)

#### Setup Required
- Create test admin user in database seed
- Create test authentication helper functions
- Mock Azure Blob Storage for icon uploads

#### Tests to Implement

1. **Authentication** (`tests/e2e/stage-3/auth.spec.ts`)
   - [ ] Admin login with valid credentials
   - [ ] Admin login with invalid credentials
   - [ ] Admin logout
   - [ ] Session persists across page reload
   - [ ] Redirect to login when accessing protected routes
   - [ ] Redirect to admin after successful login

2. **App Management - Create** (`tests/e2e/stage-3/apps-create.spec.ts`)
   - [ ] Create app with all required fields
   - [ ] Form validation (missing required fields)
   - [ ] Slug auto-generation from name
   - [ ] Icon upload (if implemented)
   - [ ] Category assignment
   - [ ] Homepage URL validation
   - [ ] Success notification after creation
   - [ ] New app appears in list

3. **App Management - Read & List** (`tests/e2e/stage-3/apps-list.spec.ts`)
   - [ ] View list of all apps
   - [ ] Pagination works correctly
   - [ ] Search apps in admin panel
   - [ ] Filter by category
   - [ ] Sort by different columns
   - [ ] View single app details

4. **App Management - Update** (`tests/e2e/stage-3/apps-update.spec.ts`)
   - [ ] Edit app name and description
   - [ ] Update app category
   - [ ] Update app icon
   - [ ] Update homepage URL
   - [ ] Form validation on update
   - [ ] Success notification after update
   - [ ] Changes reflect in public interface

5. **App Management - Delete** (`tests/e2e/stage-3/apps-delete.spec.ts`)
   - [ ] Delete confirmation dialog appears
   - [ ] Cancel delete action
   - [ ] Confirm delete action
   - [ ] App removed from list
   - [ ] Associated packages are handled (cascaded or warning)
   - [ ] Success notification after deletion

6. **Package Management** (`tests/e2e/stage-3/packages-crud.spec.ts`)
   - [ ] Create package for existing app
   - [ ] Link package to source
   - [ ] Edit package name/URL
   - [ ] Delete package
   - [ ] Validate package ID format
   - [ ] Verify package appears in command generation

7. **Category Management** (`tests/e2e/stage-3/categories-crud.spec.ts`)
   - [ ] Create new category
   - [ ] Edit category name/slug
   - [ ] Delete category (with/without apps)
   - [ ] Reorder categories (if supported)

8. **Distro & Source Management** (`tests/e2e/stage-3/distros-sources.spec.ts`)
   - [ ] Create new distro
   - [ ] Assign sources to distro
   - [ ] Set source priority
   - [ ] Edit distro details
   - [ ] Delete distro

9. **Package Refresh** (`tests/e2e/stage-3/refresh.spec.ts`)
   - [ ] Trigger manual refresh
   - [ ] View refresh logs
   - [ ] Verify packages updated after refresh
   - [ ] Handle refresh errors gracefully

**Acceptance Criteria**:
- ✅ All 25-30 tests pass
- ✅ Authentication is properly tested and secure
- ✅ CRUD operations verified end-to-end
- ✅ Admin actions reflect in public interface

---

### Stage 4: Advanced Features & Edge Cases (Priority: MEDIUM)
**Goal**: Test collections, installation history, and edge cases
**Estimated Tests**: 20-25
**Estimated Time**: 3-4 days
**Dependencies**: Stage 1-3 complete

#### Tests to Implement

1. **Collections - Creation** (`tests/e2e/stage-4/collections-create.spec.ts`)
   - [ ] Create collection with selected apps
   - [ ] Name and describe collection
   - [ ] Generate shareable token
   - [ ] Collection appears in user's collections

2. **Collections - Sharing** (`tests/e2e/stage-4/collections-share.spec.ts`)
   - [ ] Share collection via token
   - [ ] Copy share link
   - [ ] Import collection from token
   - [ ] Imported apps added to selection
   - [ ] Invalid token shows error

3. **Collections - Management** (`tests/e2e/stage-4/collections-manage.spec.ts`)
   - [ ] View all collections
   - [ ] Edit collection details
   - [ ] Delete collection
   - [ ] Add/remove apps from collection

4. **Installation History** (`tests/e2e/stage-4/installation-history.spec.ts`)
   - [ ] Generate command saves to history
   - [ ] View installation history list
   - [ ] Filter history by distro
   - [ ] Filter history by date
   - [ ] View history details
   - [ ] Regenerate command from history
   - [ ] Delete history entry

5. **Device Management** (`tests/e2e/stage-4/device-management.spec.ts`)
   - [ ] Create device
   - [ ] Associate installation with device
   - [ ] View installations per device
   - [ ] Edit device name
   - [ ] Delete device

6. **Uninstall Commands** (`tests/e2e/stage-4/uninstall-commands.spec.ts`)
   - [ ] Generate uninstall command
   - [ ] Verify uninstall syntax per source
   - [ ] Copy uninstall command
   - [ ] View uninstall from history

7. **Source Preferences** (`tests/e2e/stage-4/source-preferences.spec.ts`)
   - [ ] Set Flatpak preference
   - [ ] Set Snap preference
   - [ ] Preference affects command generation
   - [ ] Preference persists across sessions

8. **Edge Cases - Data** (`tests/e2e/stage-4/edge-cases-data.spec.ts`)
   - [ ] App with no packages for selected distro
   - [ ] App with only one source available
   - [ ] Very long app names/descriptions
   - [ ] Special characters in search
   - [ ] Large number of apps selected (50+)

9. **Edge Cases - Network** (`tests/e2e/stage-4/edge-cases-network.spec.ts`)
   - [ ] Slow network simulation
   - [ ] Network failure during command generation
   - [ ] Timeout handling
   - [ ] Retry mechanism

10. **Responsive Design** (`tests/e2e/stage-4/responsive.spec.ts`)
    - [ ] Mobile viewport works correctly
    - [ ] Tablet viewport works correctly
    - [ ] Desktop viewport works correctly
    - [ ] Touch interactions work on mobile

**Acceptance Criteria**:
- ✅ All advanced features tested
- ✅ Edge cases don't crash application
- ✅ Graceful degradation on errors
- ✅ Mobile tests pass on mobile-chrome project

---

### Stage 5: API Routes & Integration (Priority: MEDIUM)
**Goal**: Direct API testing and external integrations
**Estimated Tests**: 15-20
**Estimated Time**: 3-4 days
**Dependencies**: Stage 1 complete

#### Tests to Implement

1. **Public API Endpoints** (`tests/e2e/stage-5/api-public.spec.ts`)
   - [ ] GET /api/apps (list all apps)
   - [ ] GET /api/apps/[id] (get single app)
   - [ ] GET /api/search?q=query
   - [ ] GET /api/distros
   - [ ] GET /api/sources
   - [ ] GET /api/categories
   - [ ] POST /api/generate (command generation)
   - [ ] POST /api/uninstall (uninstall commands)
   - [ ] GET /api/collections/[token]

2. **Admin API Endpoints** (`tests/e2e/stage-5/api-admin.spec.ts`)
   - [ ] POST /api/apps (create app - requires auth)
   - [ ] PUT /api/apps/[id] (update app - requires auth)
   - [ ] DELETE /api/apps/[id] (delete app - requires auth)
   - [ ] POST /api/packages (create package - requires auth)
   - [ ] POST /api/refresh (trigger refresh - requires auth)
   - [ ] POST /api/upload (upload icon - requires auth)

3. **API Authentication** (`tests/e2e/stage-5/api-auth.spec.ts`)
   - [ ] Unauthenticated request to admin endpoint returns 401
   - [ ] Invalid token returns 401
   - [ ] Valid token allows access
   - [ ] Token expiration handling

4. **API Validation** (`tests/e2e/stage-5/api-validation.spec.ts`)
   - [ ] Missing required fields returns 400
   - [ ] Invalid data types return 400
   - [ ] Invalid UUIDs return 400
   - [ ] Validation error messages are clear

5. **API Error Handling** (`tests/e2e/stage-5/api-errors.spec.ts`)
   - [ ] 404 for non-existent resources
   - [ ] 500 for server errors
   - [ ] Rate limiting (if implemented)
   - [ ] Proper error response format

6. **API Performance** (`tests/e2e/stage-5/api-performance.spec.ts`)
   - [ ] /api/apps responds in < 500ms
   - [ ] /api/generate responds in < 2s
   - [ ] Search responds in < 300ms
   - [ ] Concurrent requests handled correctly

7. **External API Integration** (`tests/e2e/stage-5/external-apis.spec.ts`)
   - [ ] Mock Flathub API responses
   - [ ] Mock Snapcraft API responses
   - [ ] Mock AUR API responses
   - [ ] Handle external API failures gracefully
   - [ ] Refresh strategy works with mocked APIs

**Acceptance Criteria**:
- ✅ All API routes return correct status codes
- ✅ Response formats match OpenAPI spec (if exists)
- ✅ Authentication properly blocks unauthorized access
- ✅ Performance benchmarks met

---

## Strict Guidelines & Requirements

### 1. Code Quality Requirements

#### Test File Structure (MANDATORY)
Every test file MUST follow this structure:

```typescript
import { test, expect, type Page } from '@playwright/test';
import { TestHelpers } from '@/tests/helpers/test-helpers';
import { seedTestData, cleanupTestData } from '@/tests/fixtures/seed';

/**
 * Test Suite: [Name]
 *
 * Purpose: [Clear description of what this suite tests]
 * Stage: [1-5]
 * Priority: [CRITICAL/HIGH/MEDIUM/LOW]
 * Dependencies: [List any required setup or dependencies]
 *
 * @see Related documentation: [link if applicable]
 */

test.describe('[Feature Name]', () => {

  // Setup: runs before all tests in this describe block
  test.beforeAll(async () => {
    await seedTestData('feature-specific-data');
  });

  // Cleanup: runs after all tests in this describe block
  test.afterAll(async () => {
    await cleanupTestData();
  });

  // Reset state before each test
  test.beforeEach(async ({ page }) => {
    await TestHelpers.resetAppState(page);
  });

  test('should do something specific', async ({ page }) => {
    // Arrange: Set up test data and state
    await page.goto('/');

    // Act: Perform the action being tested
    await page.getByRole('button', { name: 'Click Me' }).click();

    // Assert: Verify the expected outcome
    await expect(page.getByText('Success')).toBeVisible();
  });

});
```

#### Naming Conventions (MANDATORY)

1. **Test Files**: `feature-name.spec.ts`
   - Use kebab-case
   - Descriptive feature name
   - Always end with `.spec.ts`
   - Examples: `app-selection.spec.ts`, `command-generation-basic.spec.ts`

2. **Test Descriptions**:
   - Start with `should` for test cases
   - Be specific and descriptive
   - Include expected outcome
   - Example: `should display error message when no apps are selected`

3. **Variables**:
   - Use camelCase
   - Descriptive names (avoid `a`, `b`, `temp`)
   - Example: `selectedAppCount`, `generatedCommand`, `errorMessage`

4. **Helper Functions**:
   - Use camelCase
   - Start with verb
   - Example: `selectApp()`, `generateCommand()`, `verifyCommandSyntax()`

#### Test Independence (MANDATORY)

1. **No Test Dependencies**: Each test MUST be runnable in isolation
2. **Clean State**: Every test starts with a clean state (use beforeEach)
3. **No Shared State**: Tests cannot rely on execution order
4. **Idempotent**: Running a test multiple times produces same result

#### Assertion Requirements (MANDATORY)

1. **Minimum Assertions**: Every test MUST have at least 1 assertion
2. **Specific Assertions**: Use most specific matcher available
   ```typescript
   // Good
   await expect(button).toBeEnabled();

   // Bad
   await expect(button).toHaveAttribute('disabled', false);
   ```

3. **Async Assertions**: Always use `await` with assertions
   ```typescript
   // Good
   await expect(element).toBeVisible();

   // Bad
   expect(element).toBeVisible(); // May cause flaky tests
   ```

4. **Multiple Assertions**: Group related assertions together
   ```typescript
   await expect(page.getByRole('heading', { name: 'Success' })).toBeVisible();
   await expect(page.getByText('Command generated')).toBeVisible();
   await expect(page.getByRole('button', { name: 'Copy' })).toBeEnabled();
   ```

---

### 2. Performance Requirements

#### Test Execution Speed (MANDATORY)
- **Single Test**: < 30 seconds (enforced by timeout)
- **Stage Suite**: < 5 minutes
- **Full Suite**: < 10 minutes on CI

#### Optimization Strategies (REQUIRED)
1. **Parallel Execution**: Tests within a stage run in parallel
2. **Browser Reuse**: Use `test.describe.serial()` only when necessary
3. **No Unnecessary Waits**: Never use `page.waitForTimeout()` without justification
4. **Smart Selectors**: Use role/label selectors (faster than CSS/XPath)

#### Flakiness Tolerance (MANDATORY)
- **Maximum Flakiness Rate**: 2%
- **Required**: 3 consecutive successful runs before PR merge
- **Action on Flaky Test**: Investigate immediately, mark as `.skip()` if blocker

---

### 3. Selector Standards (MANDATORY)

#### Selector Priority Order
Use selectors in this order of preference:

1. **Role + Name** (BEST - accessibility focused)
   ```typescript
   page.getByRole('button', { name: 'Generate Command' })
   page.getByRole('heading', { name: 'Install Firefox' })
   ```

2. **Label** (for form inputs)
   ```typescript
   page.getByLabel('Distro')
   page.getByLabel('Search apps')
   ```

3. **Placeholder**
   ```typescript
   page.getByPlaceholder('Search apps...')
   ```

4. **Test ID** (when semantic selectors aren't available)
   ```typescript
   page.getByTestId('app-card-firefox')
   ```

5. **Text** (for unique text content)
   ```typescript
   page.getByText('Copied to clipboard!')
   ```

6. **CSS Selectors** (AVOID unless necessary)
   ```typescript
   page.locator('[data-app-id="firefox"]') // Last resort
   ```

#### Forbidden Selectors
- ❌ XPath (brittle, hard to read)
- ❌ Complex CSS chains (`.parent .child .grandchild`)
- ❌ Index-based selectors (`.nth(0)` - use when no alternative)

---

### 4. Error Handling & Debugging

#### Required Error Context (MANDATORY)
Every test MUST provide clear failure messages:

```typescript
// Good
await expect(button, 'Generate button should be enabled after app selection')
  .toBeEnabled();

// Bad
await expect(button).toBeEnabled();
```

#### Screenshot & Video Requirements
- **Screenshots**: On failure (automatic)
- **Videos**: On failure (automatic in CI)
- **Traces**: On first retry (automatic)

#### Debugging Helpers (REQUIRED)
Add these utilities to all test files:

```typescript
// Take manual screenshot with descriptive name
await page.screenshot({ path: `debug-${test.info().title}.png` });

// Log current page state
console.log('Current URL:', page.url());
console.log('Page title:', await page.title());

// Pause test execution for debugging
await page.pause(); // Only in local development
```

---

### 5. Data Management

#### Test Data Requirements (MANDATORY)

1. **Seed Data**: Every stage MUST have seed data
   - Location: `/tests/fixtures/stage-{N}-seed.ts`
   - Must include: apps, categories, distros, sources, packages
   - Must be idempotent (safe to run multiple times)

2. **Cleanup**: Every test suite MUST clean up after itself
   ```typescript
   test.afterAll(async () => {
     await cleanupTestData();
   });
   ```

3. **Test Isolation**: Use unique identifiers for test data
   ```typescript
   const testApp = {
     name: `Test App ${Date.now()}`,
     slug: `test-app-${Date.now()}`,
   };
   ```

#### Fixture Requirements

**File**: `/tests/fixtures/base-fixtures.ts`

```typescript
export const baseFixtures = {
  // Distros
  ubuntu: {
    id: 'ubuntu-22-04',
    name: 'Ubuntu 22.04',
    slug: 'ubuntu-22-04',
    codename: 'jammy',
  },

  // Sources
  aptSource: {
    id: 'apt',
    name: 'APT',
    slug: 'apt',
    type: 'package_manager',
  },

  // Apps
  firefox: {
    id: 'firefox',
    name: 'Firefox',
    slug: 'firefox',
    description: 'Web browser',
  },

  // ... more fixtures
};
```

---

### 6. CI/CD Requirements

#### GitHub Actions Workflow (REQUIRED)

**File**: `/.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-stage-1:
    name: Stage 1 - Core Flows
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Install Playwright
        run: bunx playwright install --with-deps chromium

      - name: Run Stage 1 Tests
        run: bun run test:e2e:stage-1

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-stage-1
          path: playwright-report/
          retention-days: 7

  # Repeat for stages 2-5

  test-all:
    name: All E2E Tests
    runs-on: ubuntu-latest
    needs: [test-stage-1, test-stage-2, test-stage-3, test-stage-4, test-stage-5]
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
      - name: Install Playwright
        run: bunx playwright install --with-deps
      - name: Run All E2E Tests
        run: bun run test:e2e
```

#### Required Checks Before Merge (MANDATORY)
- ✅ All E2E tests pass
- ✅ No new flaky tests introduced
- ✅ Test coverage increased or maintained
- ✅ Performance benchmarks met

---

### 7. Documentation Requirements

#### Test Documentation (REQUIRED)
Every test file MUST have:

1. **File Header**: Purpose, stage, priority, dependencies
2. **Describe Block**: Clear feature description
3. **Test Cases**: Each test has descriptive name and comments
4. **Complex Logic**: Inline comments explaining "why"

#### README for Each Stage (REQUIRED)

**File**: `/tests/e2e/stage-{N}/README.md`

```markdown
# Stage N: [Name]

## Overview
[Description of what this stage tests]

## Prerequisites
- [ ] Stage N-1 complete
- [ ] Test data seeded
- [ ] Environment configured

## Test Files
- `file-1.spec.ts` - [Description]
- `file-2.spec.ts` - [Description]

## Running Tests
```bash
bun run test:e2e:stage-N
```

## Known Issues
- [List any known issues or limitations]

## Ownership
- **Implemented by**: [Name/Agent ID]
- **Reviewed by**: [Name]
- **Last updated**: [Date]
```

---

## Test Categories

### By Priority

#### CRITICAL (Must pass before deploy)
- Core user flows (Stage 1)
- Authentication (Stage 3)
- Command generation accuracy (Stage 1)

#### HIGH (Should pass before deploy)
- Search & filter (Stage 2)
- Admin CRUD (Stage 3)
- API endpoints (Stage 5)

#### MEDIUM (Nice to have)
- Advanced features (Stage 4)
- Edge cases (Stage 4)
- Performance benchmarks (Stage 5)

#### LOW (Can be skipped in CI)
- Visual regression tests
- Cross-browser tests (firefox, webkit, mobile)

### By Type

#### Functional Tests (80% of suite)
- User interactions
- Data manipulation
- Business logic

#### Integration Tests (15% of suite)
- API integration
- Database operations
- External service calls

#### Performance Tests (5% of suite)
- Load time benchmarks
- API response times
- Memory usage

---

## File Structure

```
linite/
├── tests/
│   ├── e2e/
│   │   ├── stage-1/                    # Core user flows
│   │   │   ├── README.md
│   │   │   ├── app-selection.spec.ts
│   │   │   ├── command-generation-basic.spec.ts
│   │   │   ├── distro-selection.spec.ts
│   │   │   ├── command-display.spec.ts
│   │   │   └── error-handling-user.spec.ts
│   │   │
│   │   ├── stage-2/                    # Search & navigation
│   │   │   ├── README.md
│   │   │   ├── search.spec.ts
│   │   │   ├── category-filter.spec.ts
│   │   │   ├── view-modes.spec.ts
│   │   │   ├── infinite-scroll.spec.ts
│   │   │   ├── keyboard-navigation.spec.ts
│   │   │   └── popular-featured.spec.ts
│   │   │
│   │   ├── stage-3/                    # Admin interface
│   │   │   ├── README.md
│   │   │   ├── auth.spec.ts
│   │   │   ├── apps-create.spec.ts
│   │   │   ├── apps-list.spec.ts
│   │   │   ├── apps-update.spec.ts
│   │   │   ├── apps-delete.spec.ts
│   │   │   ├── packages-crud.spec.ts
│   │   │   ├── categories-crud.spec.ts
│   │   │   ├── distros-sources.spec.ts
│   │   │   └── refresh.spec.ts
│   │   │
│   │   ├── stage-4/                    # Advanced features
│   │   │   ├── README.md
│   │   │   ├── collections-create.spec.ts
│   │   │   ├── collections-share.spec.ts
│   │   │   ├── collections-manage.spec.ts
│   │   │   ├── installation-history.spec.ts
│   │   │   ├── device-management.spec.ts
│   │   │   ├── uninstall-commands.spec.ts
│   │   │   ├── source-preferences.spec.ts
│   │   │   ├── edge-cases-data.spec.ts
│   │   │   ├── edge-cases-network.spec.ts
│   │   │   └── responsive.spec.ts
│   │   │
│   │   └── stage-5/                    # API & integration
│   │       ├── README.md
│   │       ├── api-public.spec.ts
│   │       ├── api-admin.spec.ts
│   │       ├── api-auth.spec.ts
│   │       ├── api-validation.spec.ts
│   │       ├── api-errors.spec.ts
│   │       ├── api-performance.spec.ts
│   │       └── external-apis.spec.ts
│   │
│   ├── fixtures/                       # Test data
│   │   ├── base-fixtures.ts           # Shared fixtures
│   │   ├── stage-1-seed.ts
│   │   ├── stage-2-seed.ts
│   │   ├── stage-3-seed.ts
│   │   ├── stage-4-seed.ts
│   │   ├── stage-5-seed.ts
│   │   └── seed.ts                     # Main seed orchestrator
│   │
│   ├── helpers/                        # Test utilities
│   │   ├── test-helpers.ts            # Common helpers
│   │   ├── auth-helpers.ts            # Authentication utilities
│   │   ├── command-helpers.ts         # Command validation
│   │   ├── api-helpers.ts             # API testing utilities
│   │   └── db-helpers.ts              # Database utilities
│   │
│   └── mocks/                          # Mock data
│       ├── external-apis/
│       │   ├── flathub-mock.ts
│       │   ├── snapcraft-mock.ts
│       │   └── aur-mock.ts
│       └── api-responses/
│           └── *.json
│
├── playwright.config.ts                # Playwright configuration
├── .env.test                           # Test environment variables
└── test-results/                       # Generated reports (gitignored)
```

---

## Writing Standards

### Test Structure Template

```typescript
import { test, expect, type Page } from '@playwright/test';

/**
 * Test Suite: [Feature Name]
 *
 * Purpose: [What does this test suite verify?]
 * Stage: [1-5]
 * Priority: [CRITICAL/HIGH/MEDIUM/LOW]
 */

test.describe('[Feature Name]', () => {

  test.beforeEach(async ({ page }) => {
    // Common setup for all tests in this suite
    await page.goto('/');
  });

  test('should [specific behavior]', async ({ page }) => {
    // Arrange: Set up preconditions
    const appCard = page.getByRole('button', { name: 'Firefox' });

    // Act: Perform the action
    await appCard.click();

    // Assert: Verify expected outcome
    await expect(appCard).toHaveAttribute('aria-pressed', 'true');
  });

  test('should [another specific behavior]', async ({ page }) => {
    // Another independent test
  });

});
```

### Best Practices

#### DO ✅
- Use semantic locators (role, label, placeholder)
- Write descriptive test names
- Test user-visible behavior, not implementation
- Keep tests focused (one behavior per test)
- Use beforeEach for common setup
- Add comments for complex logic
- Make tests deterministic
- Handle async properly with await
- Clean up after tests
- Use TypeScript for type safety

#### DON'T ❌
- Use hardcoded waits (`waitForTimeout`)
- Test implementation details
- Share state between tests
- Use brittle CSS/XPath selectors
- Make tests depend on each other
- Skip error handling
- Ignore flaky tests
- Use magic numbers without constants
- Test multiple behaviors in one test
- Forget to await async operations

---

## CI/CD Integration

### GitHub Actions Requirements

1. **Trigger on PR**: All stages run on PR to main/develop
2. **Trigger on Push**: Stage 1 runs on every push
3. **Nightly Full Suite**: All tests run nightly
4. **Branch Protection**: Require passing tests before merge

### CI Optimization

1. **Caching**: Cache `node_modules` and Playwright browsers
2. **Parallelization**: Run stages in parallel where possible
3. **Fail Fast**: Stop on first stage failure
4. **Artifacts**: Save reports and videos for debugging

### Status Badges

Add to `README.md`:

```markdown
![E2E Tests](https://github.com/username/linite/workflows/E2E%20Tests/badge.svg)
```

---

## Maintenance Guidelines

### Regular Maintenance Tasks

#### Weekly
- [ ] Review flaky test reports
- [ ] Update test data if schema changes
- [ ] Check test execution times
- [ ] Review failed test artifacts

#### Monthly
- [ ] Update Playwright to latest version
- [ ] Review and refactor slow tests
- [ ] Update test documentation
- [ ] Audit test coverage

#### Per Release
- [ ] Run full test suite on staging
- [ ] Verify all critical tests pass
- [ ] Update test data for new features
- [ ] Add tests for new features

### Handling Flaky Tests

1. **Identify**: Monitor test results for inconsistent failures
2. **Investigate**: Use traces and videos to debug
3. **Fix**: Common causes:
   - Missing waits for elements
   - Race conditions
   - Non-deterministic data
   - Timing issues
4. **Mark**: If unfixable immediately, mark as `.skip()` and create issue
5. **Track**: Keep flakiness rate < 2%

### Updating Tests for Code Changes

When code changes affect tests:

1. **Breaking Changes**: Update affected tests immediately
2. **New Features**: Add tests in same PR
3. **Deprecations**: Mark tests as deprecated, add new versions
4. **Refactoring**: Update tests to match new structure

---

## Test Templates

### Template 1: User Flow Test

```typescript
import { test, expect } from '@playwright/test';

/**
 * Test Suite: [Feature] User Flow
 * Stage: [1-5]
 * Priority: CRITICAL
 */

test.describe('[Feature] User Flow', () => {

  test('should complete [specific user journey]', async ({ page }) => {
    // Step 1: Navigate to starting point
    await page.goto('/');

    // Step 2: First user action
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page).toHaveURL(/\/next-step/);

    // Step 3: Intermediate action
    await page.getByLabel('Input Field').fill('Test Value');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 4: Verify final state
    await expect(page.getByRole('heading', { name: 'Success' }))
      .toBeVisible();
    await expect(page.getByText('Completed successfully'))
      .toBeVisible();
  });

});
```

### Template 2: API Test

```typescript
import { test, expect } from '@playwright/test';

/**
 * Test Suite: [API Endpoint] Tests
 * Stage: 5
 * Priority: HIGH
 */

test.describe('[API Endpoint]', () => {

  test('should return correct data structure', async ({ request }) => {
    // Make API request
    const response = await request.get('/api/endpoint');

    // Verify response status
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Verify response data
    const data = await response.json();
    expect(data).toHaveProperty('field1');
    expect(data).toHaveProperty('field2');
    expect(Array.isArray(data.items)).toBeTruthy();
  });

  test('should handle invalid input', async ({ request }) => {
    const response = await request.post('/api/endpoint', {
      data: { invalid: 'data' }
    });

    expect(response.status()).toBe(400);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('validation');
  });

});
```

### Template 3: Form Test

```typescript
import { test, expect } from '@playwright/test';

/**
 * Test Suite: [Form Name] Form Tests
 * Stage: 3
 * Priority: HIGH
 */

test.describe('[Form Name] Form', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/form-page');
  });

  test('should submit form with valid data', async ({ page }) => {
    // Fill form fields
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Message').fill('This is a test message');

    // Submit form
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify success
    await expect(page.getByText('Form submitted successfully'))
      .toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Attempt to submit without filling
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify validation errors
    await expect(page.getByText('Name is required'))
      .toBeVisible();
    await expect(page.getByText('Email is required'))
      .toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Invalid email format'))
      .toBeVisible();
  });

});
```

### Template 4: Authentication Test

```typescript
import { test, expect } from '@playwright/test';
import { AuthHelpers } from '@/tests/helpers/auth-helpers';

/**
 * Test Suite: Authentication
 * Stage: 3
 * Priority: CRITICAL
 */

test.describe('Authentication', () => {

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.getByLabel('Password').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Login' }).click();

    // Verify redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: 'Dashboard' }))
      .toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    // Verify error message
    await expect(page.getByText('Invalid credentials'))
      .toBeVisible();

    // Verify still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await AuthHelpers.login(page);

    // Then logout
    await page.getByRole('button', { name: 'Logout' }).click();

    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should maintain session after page reload', async ({ page, context }) => {
    await AuthHelpers.login(page);

    // Reload page
    await page.reload();

    // Verify still logged in
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: 'Dashboard' }))
      .toBeVisible();
  });

});
```

---

## Quick Reference

### Common Commands

```bash
# Run all tests
bun run test:e2e

# Run specific stage
bun run test:e2e:stage-1

# Run in UI mode (interactive)
bun run test:e2e:ui

# Run in debug mode
bun run test:e2e:debug

# Run with headed browser (see what's happening)
bun run test:e2e:headed

# Run specific test file
bun run test:e2e tests/e2e/stage-1/app-selection.spec.ts

# Run tests matching pattern
bun run test:e2e --grep "should select app"

# Run only chromium
bun run test:e2e:chromium

# Generate HTML report
bun run test:e2e:report
```

### Useful Playwright Methods

```typescript
// Navigation
await page.goto('/path');
await page.goBack();
await page.reload();

// Locators (by priority)
page.getByRole('button', { name: 'Click' })
page.getByLabel('Email')
page.getByPlaceholder('Search')
page.getByText('Hello World')
page.getByTestId('my-element')

// Actions
await element.click();
await element.fill('text');
await element.check();
await element.selectOption('value');
await element.hover();
await element.press('Enter');

// Assertions
await expect(element).toBeVisible();
await expect(element).toBeHidden();
await expect(element).toBeEnabled();
await expect(element).toHaveText('text');
await expect(element).toHaveValue('value');
await expect(element).toHaveAttribute('attr', 'value');
await expect(page).toHaveURL(/pattern/);
await expect(page).toHaveTitle('Title');

// Waiting
await page.waitForLoadState('networkidle');
await page.waitForSelector('css-selector');
await element.waitFor({ state: 'visible' });

// API Testing
const response = await request.get('/api/endpoint');
expect(response.ok()).toBeTruthy();
const data = await response.json();
```

---

## Checklist for Agents

### Before Starting Stage N

- [ ] Stage N-1 complete and reviewed
- [ ] Stage 0 (setup) complete if starting Stage 1
- [ ] Read this plan thoroughly
- [ ] Understand strict guidelines
- [ ] Review test templates
- [ ] Check fixtures exist for this stage
- [ ] Create stage README file

### While Implementing Stage N

- [ ] Follow file naming conventions
- [ ] Use semantic selectors (role, label)
- [ ] Write descriptive test names
- [ ] Add proper documentation headers
- [ ] Include minimum 1 assertion per test
- [ ] Tests are independent (can run in isolation)
- [ ] No hardcoded waits
- [ ] All async operations use await
- [ ] Error messages are descriptive
- [ ] Tests complete in < 30 seconds

### After Completing Stage N

- [ ] All tests pass locally (run 3 times)
- [ ] No flaky tests
- [ ] Stage completes in < 5 minutes
- [ ] Code reviewed by another agent/developer
- [ ] Documentation updated
- [ ] README created for stage
- [ ] CI/CD workflow updated
- [ ] Stage marked as complete in this plan

---

## Status Tracking

### Stage 0: Setup & Configuration
- **Status**: ✅ Complete
- **Assigned to**: Claude Sonnet 4.5
- **Started**: 2026-01-23
- **Completed**: 2026-01-23
- **Tests**: N/A (Setup stage)
- **Notes**:
  - Installed Playwright with Chromium, Firefox, and WebKit browsers
  - Created playwright.config.ts with multi-browser configuration
  - Set up test environment (.env.test) with test database
  - Created complete directory structure (5 stages + helpers + fixtures + mocks)
  - Implemented 5 helper utility files (test, auth, command, api, db)
  - Created base fixtures with sample data and seed functions
  - Added 15 npm scripts for running E2E tests
  - Updated .gitignore for test artifacts
  - Created comprehensive Stage 0 README documentation
  - Ready for Stage 1 implementation

### Stage 1: Core User Flows
- **Status**: ⏳ Not Started
- **Assigned to**: [Agent/Developer Name]
- **Started**: [Date]
- **Completed**: [Date]
- **Tests**: 0/20 passing
- **Notes**:

### Stage 2: Search, Filter & Navigation
- **Status**: ⏳ Not Started
- **Assigned to**: [Agent/Developer Name]
- **Started**: [Date]
- **Completed**: [Date]
- **Tests**: 0/25 passing
- **Notes**: Can run in parallel with Stage 3

### Stage 3: Admin Interface
- **Status**: ⏳ Not Started
- **Assigned to**: [Agent/Developer Name]
- **Started**: [Date]
- **Completed**: [Date]
- **Tests**: 0/30 passing
- **Notes**: Can run in parallel with Stage 2

### Stage 4: Advanced Features & Edge Cases
- **Status**: ⏳ Not Started
- **Assigned to**: [Agent/Developer Name]
- **Started**: [Date]
- **Completed**: [Date]
- **Tests**: 0/25 passing
- **Notes**: Requires Stage 1-3 complete

### Stage 5: API Routes & Integration
- **Status**: ⏳ Not Started
- **Assigned to**: [Agent/Developer Name]
- **Started**: [Date]
- **Completed**: [Date]
- **Tests**: 0/20 passing
- **Notes**: Can run in parallel with Stage 4

---

## Questions & Clarifications

Use this section to track questions and decisions:

| Date | Question | Answer | Decided By |
|------|----------|--------|------------|
| 2026-01-23 | Initial plan created | - | System |
|  |  |  |  |

---

## Related Documentation

- [Project Overview](/docs/PROJECT_OVERVIEW.md)
- [API Reference](/docs/API_REFERENCE.md)
- [Database Schema](/docs/DATABASE_SCHEMA.md)
- [Repository Structure](/docs/REPOSITORY_STRUCTURE.md)
- [Claude Development Guide](/CLAUDE.md)

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-23 | Initial E2E testing plan created | Claude Sonnet 4.5 |
|  |  |  |  |

---

**End of Document**
