import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type {
  App,
  Category,
  Distro,
  Source,
  Package,
  AppWithRelations,
  PackageWithRelations,
} from '../types';
import { useSelectionStore } from '../stores/selection-store';

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Create a mock App with default values
 */
export function createMockApp(overrides?: Partial<App>): App {
  return {
    id: `app-${Math.random().toString(36).substring(7)}`,
    slug: 'test-app',
    displayName: 'Test App',
    description: 'A test application',
    iconUrl: 'https://example.com/icon.png',
    homepage: 'https://example.com',
    isPopular: false,
    isFoss: true,
    categoryId: 'cat-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock Category with default values
 */
export function createMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: `cat-${Math.random().toString(36).substring(7)}`,
    name: 'Test Category',
    slug: 'test-category',
    icon: '📦',
    description: 'A test category',
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock Distro with default values
 */
export function createMockDistro(overrides?: Partial<Distro>): Distro {
  return {
    id: `distro-${Math.random().toString(36).substring(7)}`,
    name: 'Test Distro',
    slug: 'test-distro',
    family: 'debian',
    iconUrl: 'https://example.com/distro-icon.png',
    basedOn: 'debian',
    isPopular: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock Source with default values
 */
export function createMockSource(overrides?: Partial<Source>): Source {
  return {
    id: `source-${Math.random().toString(36).substring(7)}`,
    name: 'Test Source',
    slug: 'test-source',
    installCmd: 'install {package}',
    requireSudo: false,
    setupCmd: null,
    priority: 50,
    apiEndpoint: 'https://api.example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock Package with default values
 */
export function createMockPackage(overrides?: Partial<Package>): Package {
  return {
    id: `pkg-${Math.random().toString(36).substring(7)}`,
    appId: 'app-1',
    sourceId: 'source-1',
    identifier: 'test-package',
    version: '1.0.0',
    size: 1024000,
    maintainer: 'Test Maintainer',
    isAvailable: true,
    lastChecked: new Date(),
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock AppWithRelations (includes category and packages)
 */
export function createMockAppWithRelations(
  overrides?: Partial<AppWithRelations>
): AppWithRelations {
  const app = createMockApp(overrides);
  return {
    ...app,
    category: createMockCategory({ id: app.categoryId }),
    packages: [],
    ...overrides,
  };
}

/**
 * Create a mock PackageWithRelations (includes app and source)
 */
export function createMockPackageWithRelations(
  overrides?: Partial<PackageWithRelations>
): PackageWithRelations {
  const pkg = createMockPackage(overrides);
  return {
    ...pkg,
    app: {
      id: pkg.appId,
      displayName: 'Test App',
      slug: 'test-app',
    },
    source: {
      id: pkg.sourceId,
      name: 'Test Source',
      slug: 'test-source',
      installCmd: 'install {package}',
      requireSudo: false,
    },
    ...overrides,
  };
}

/**
 * Create multiple mock apps at once
 */
export function createMockApps(count: number, overrides?: Partial<App>): App[] {
  return Array.from({ length: count }, (_, i) =>
    createMockApp({
      id: `app-${i + 1}`,
      slug: `app-${i + 1}`,
      displayName: `App ${i + 1}`,
      ...overrides,
    })
  );
}

// ============================================================================
// TEST PROVIDERS
// ============================================================================

/**
 * Create a fresh QueryClient for testing
 * Disables retries and sets cache time to 0 for predictable tests
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface TestProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

/**
 * All providers needed for testing components
 * Includes QueryClientProvider and can be extended with theme, auth, etc.
 */
export function TestProviders({
  children,
  queryClient = createTestQueryClient(),
}: TestProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ============================================================================
// CUSTOM RENDER
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with necessary providers
 * Use this instead of RTL's render() for all component tests
 *
 * @example
 * const { getByText } = renderWithProviders(<MyComponent />);
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders queryClient={queryClient}>{children}</TestProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// ============================================================================
// MOCK UTILITIES
// ============================================================================

/**
 * Mock the global fetch API
 * Returns a vi.fn() that can be configured per test
 *
 * @example
 * const mockFetch = mockGlobalFetch();
 * mockFetch.mockResolvedValueOnce({
 *   ok: true,
 *   json: async () => ({ data: [...] }),
 * });
 */
export function mockGlobalFetch() {
  const mockFetch = vi.fn();
  global.fetch = mockFetch as any;
  return mockFetch;
}

/**
 * Create a mock fetch response
 */
export function createMockResponse<T>(data: T, status = 200, ok = true) {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  } as Response;
}

/**
 * Mock successful API response
 */
export function mockApiSuccess<T>(data: T) {
  return createMockResponse({ data, success: true }, 200, true);
}

/**
 * Mock API error response
 */
export function mockApiError(message: string, status = 400) {
  return createMockResponse(
    { error: message, success: false },
    status,
    false
  );
}

/**
 * Mock navigator.clipboard for copy/paste tests
 */
export function mockClipboard() {
  const mockWriteText = vi.fn();
  const mockReadText = vi.fn();

  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: mockWriteText,
      readText: mockReadText,
    },
    writable: true,
    configurable: true,
  });

  return {
    writeText: mockWriteText,
    readText: mockReadText,
  };
}

/**
 * Mock console methods to suppress expected errors/warnings in tests
 */
export function mockConsole() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  return {
    mockError: vi.spyOn(console, 'error').mockImplementation(() => {}),
    mockWarn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    mockLog: vi.spyOn(console, 'log').mockImplementation(() => {}),
    restore: () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    },
  };
}

// ============================================================================
// ZUSTAND STORE UTILITIES
// ============================================================================

/**
 * Mock localStorage for Zustand persist
 */
function ensureLocalStorageMock() {
  if (typeof global.localStorage === 'undefined') {
    const storage: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((key) => delete storage[key]);
      },
      get length() {
        return Object.keys(storage).length;
      },
      key: (index: number) => Object.keys(storage)[index] || null,
    };
  }
}

/**
 * Reset all Zustand stores to initial state
 * Call this in beforeEach/afterEach to ensure test isolation
 */
export function resetStores() {
  ensureLocalStorageMock();
  useSelectionStore.getState().reset();
}

/**
 * Set up the selection store with test data
 */
export function setupSelectionStore(options: {
  apps?: string[];
  distro?: string;
  sourcePreference?: string;
  nixosMethod?: 'nix-shell' | 'nix-env' | 'nix-flakes';
}) {
  ensureLocalStorageMock();
  const store = useSelectionStore.getState();

  if (options.apps) {
    store.setApps(options.apps);
  }
  if (options.distro) {
    store.setDistro(options.distro);
  }
  if (options.sourcePreference) {
    store.setSourcePreference(options.sourcePreference);
  }
  if (options.nixosMethod) {
    store.setNixosInstallMethod(options.nixosMethod);
  }
}

// ============================================================================
// AUTH MOCKING
// ============================================================================

/**
 * Mock the useSession hook from better-auth
 */
export function mockSession(isAuthenticated: boolean = false) {
  const mockUseSession = vi.fn(() => ({
    data: isAuthenticated
      ? {
          session: {
            userId: 'test-user-id',
            expiresAt: new Date(Date.now() + 86400000),
          },
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
          },
        }
      : null,
    isPending: false,
    error: null,
  }));

  vi.mock('@/lib/auth-client', () => ({
    useSession: mockUseSession,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }));

  return mockUseSession;
}

// ============================================================================
// WAIT UTILITIES
// ============================================================================

/**
 * Wait for async operations to complete
 */
export function waitForAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Wait for a specific amount of time (use with vi.useFakeTimers)
 */
export async function advanceTimers(ms: number) {
  const { vi } = await import('vitest');
  vi.advanceTimersByTime(ms);
  await waitForAsync();
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Check if an element has a specific class
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * Get all elements by test ID
 */
export function getAllByTestId(
  container: HTMLElement,
  testId: string
): HTMLElement[] {
  return Array.from(container.querySelectorAll(`[data-testid="${testId}"]`));
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export commonly used testing library functions
export * from '@testing-library/react';
export { vi } from 'vitest';
