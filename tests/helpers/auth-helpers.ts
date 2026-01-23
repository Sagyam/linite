import { type Page, type BrowserContext } from '@playwright/test';

/**
 * Authentication Helpers - Utilities for testing authentication flows
 *
 * These helpers provide reusable functions for logging in, logging out,
 * and managing authentication state during E2E tests.
 */

export class AuthHelpers {
  /**
   * Login to admin dashboard with test credentials
   * @param page - Playwright page object
   * @param email - Admin email (defaults to TEST_ADMIN_EMAIL from env)
   * @param password - Admin password (defaults to TEST_ADMIN_PASSWORD from env)
   */
  static async login(
    page: Page,
    email?: string,
    password?: string
  ): Promise<void> {
    const testEmail = email || process.env.TEST_ADMIN_EMAIL || 'admin@test.linite.com';
    const testPassword = password || process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!';

    // Navigate to login page
    await page.goto('/login');

    // Fill in credentials
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Submit login form
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin/, { timeout: 10000 });
  }

  /**
   * Login using OAuth (GitHub/Google)
   * Note: This requires mocking the OAuth flow
   * @param page - Playwright page object
   * @param provider - OAuth provider (github, google)
   */
  static async loginWithOAuth(
    page: Page,
    provider: 'github' | 'google'
  ): Promise<void> {
    // Navigate to login page
    await page.goto('/login');

    // Click OAuth provider button
    await page.getByRole('button', { name: new RegExp(provider, 'i') }).click();

    // TODO: Mock OAuth flow
    // This will require intercepting network requests and providing mock responses
  }

  /**
   * Logout from admin dashboard
   * @param page - Playwright page object
   */
  static async logout(page: Page): Promise<void> {
    // Click logout button (adjust selector based on your UI)
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    // Wait for redirect to login page
    await page.waitForURL(/\/login/, { timeout: 5000 });
  }

  /**
   * Check if user is authenticated
   * @param page - Playwright page object
   * @returns true if authenticated, false otherwise
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    try {
      // Try to navigate to admin page
      await page.goto('/admin');

      // If we're redirected to login, user is not authenticated
      const url = page.url();
      return !url.includes('/login');
    } catch {
      return false;
    }
  }

  /**
   * Get authentication token from cookies or localStorage
   * @param page - Playwright page object
   * @returns Authentication token or null
   */
  static async getAuthToken(page: Page): Promise<string | null> {
    // Try to get from localStorage first
    const localStorageToken = await page.evaluate(() => {
      return localStorage.getItem('auth_token') || localStorage.getItem('token');
    });

    if (localStorageToken) {
      return localStorageToken;
    }

    // Try to get from cookies
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(
      (cookie) => cookie.name === 'auth_token' || cookie.name === 'token'
    );

    return authCookie?.value || null;
  }

  /**
   * Set authentication token in cookies or localStorage
   * Useful for bypassing login flow in tests
   * @param page - Playwright page object
   * @param token - Authentication token
   */
  static async setAuthToken(page: Page, token: string): Promise<void> {
    // Set in localStorage
    await page.evaluate((t) => {
      localStorage.setItem('auth_token', t);
    }, token);

    // Set in cookies
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ]);
  }

  /**
   * Create a new authenticated context
   * Useful for running tests with a pre-authenticated user
   * @param context - Browser context
   * @returns Promise<void>
   */
  static async setupAuthenticatedContext(
    context: BrowserContext
  ): Promise<void> {
    // Add authentication cookies to context
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'test-auth-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
  }

  /**
   * Clear authentication state
   * Removes tokens from cookies and localStorage
   * @param page - Playwright page object
   */
  static async clearAuth(page: Page): Promise<void> {
    // Clear localStorage
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
    });

    // Clear cookies
    await page.context().clearCookies();
  }

  /**
   * Verify admin access
   * Checks if current user can access admin routes
   * @param page - Playwright page object
   * @returns true if user has admin access
   */
  static async hasAdminAccess(page: Page): Promise<boolean> {
    try {
      await page.goto('/admin');

      // Wait a bit to see if we get redirected
      await page.waitForTimeout(1000);

      const url = page.url();
      return url.includes('/admin') && !url.includes('/login');
    } catch {
      return false;
    }
  }

  /**
   * Wait for authentication state to change
   * Useful when waiting for login/logout to complete
   * @param page - Playwright page object
   * @param authenticated - Expected authentication state
   * @param timeout - Maximum time to wait (ms)
   */
  static async waitForAuthState(
    page: Page,
    authenticated: boolean,
    timeout: number = 5000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const isAuth = await this.isAuthenticated(page);
      if (isAuth === authenticated) {
        return;
      }
      await page.waitForTimeout(100);
    }

    throw new Error(
      `Timeout waiting for auth state: ${authenticated ? 'authenticated' : 'unauthenticated'}`
    );
  }

  /**
   * Mock authentication for testing
   * Bypasses actual login and sets up authentication state
   * @param page - Playwright page object
   */
  static async mockAuthentication(page: Page): Promise<void> {
    await this.setAuthToken(page, 'mocked-test-token');

    // Set user data in localStorage if needed
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'admin@test.linite.com',
        role: 'admin',
      }));
    });
  }
}
