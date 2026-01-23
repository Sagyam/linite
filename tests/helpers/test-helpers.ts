import { type Page } from '@playwright/test';

/**
 * Test Helpers - Common utilities for E2E tests
 *
 * This file contains reusable helper functions that can be used
 * across all E2E tests to reduce code duplication and improve
 * test maintainability.
 */

export class TestHelpers {
  /**
   * Reset application state to a clean slate
   * Clears localStorage, sessionStorage, and cookies
   */
  static async resetAppState(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  }

  /**
   * Wait for network to be idle (no pending requests)
   */
  static async waitForNetworkIdle(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a specific API call to complete
   * @param page - Playwright page object
   * @param urlPattern - URL pattern to wait for (string or regex)
   * @param method - HTTP method (GET, POST, etc.)
   */
  static async waitForApiCall(
    page: Page,
    urlPattern: string | RegExp,
    method: string = 'GET'
  ): Promise<void> {
    await page.waitForResponse(
      (response) =>
        response.url().match(urlPattern) !== null &&
        response.request().method() === method
    );
  }

  /**
   * Take a screenshot with a descriptive name
   * Useful for debugging test failures
   */
  static async takeDebugScreenshot(
    page: Page,
    name: string
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `test-results/debug-${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  /**
   * Get current page URL path (without domain)
   */
  static async getCurrentPath(page: Page): Promise<string> {
    return new URL(page.url()).pathname;
  }

  /**
   * Scroll to an element to ensure it's in view
   */
  static async scrollToElement(
    page: Page,
    selector: string
  ): Promise<void> {
    await page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for a specific text to appear on the page
   */
  static async waitForText(
    page: Page,
    text: string,
    timeout: number = 5000
  ): Promise<void> {
    await page.getByText(text).waitFor({ state: 'visible', timeout });
  }

  /**
   * Fill form field by label
   * More semantic than using selectors
   */
  static async fillFieldByLabel(
    page: Page,
    label: string,
    value: string
  ): Promise<void> {
    await page.getByLabel(label).fill(value);
  }

  /**
   * Click button by name
   * More semantic than using selectors
   */
  static async clickButton(page: Page, name: string): Promise<void> {
    await page.getByRole('button', { name }).click();
  }

  /**
   * Check if an element is visible
   */
  static async isVisible(
    page: Page,
    selector: string
  ): Promise<boolean> {
    try {
      await page.locator(selector).waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get text content of an element
   */
  static async getTextContent(
    page: Page,
    selector: string
  ): Promise<string | null> {
    return await page.locator(selector).textContent();
  }

  /**
   * Wait for element to be hidden
   */
  static async waitForHidden(
    page: Page,
    selector: string,
    timeout: number = 5000
  ): Promise<void> {
    await page.locator(selector).waitFor({ state: 'hidden', timeout });
  }

  /**
   * Reload page and wait for network idle
   */
  static async reloadPage(page: Page): Promise<void> {
    await page.reload();
    await this.waitForNetworkIdle(page);
  }

  /**
   * Get localStorage value
   */
  static async getLocalStorageItem(
    page: Page,
    key: string
  ): Promise<string | null> {
    return await page.evaluate((k) => localStorage.getItem(k), key);
  }

  /**
   * Set localStorage value
   */
  static async setLocalStorageItem(
    page: Page,
    key: string,
    value: string
  ): Promise<void> {
    await page.evaluate(
      ({ k, v }) => localStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  /**
   * Mock clipboard API
   * Useful for testing copy-to-clipboard functionality
   */
  static async mockClipboard(page: Page): Promise<void> {
    await page.evaluate(() => {
      let clipboardData = '';
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            clipboardData = text;
            return Promise.resolve();
          },
          readText: async () => {
            return Promise.resolve(clipboardData);
          },
        },
        writable: true,
      });
    });
  }

  /**
   * Get clipboard content (requires mockClipboard to be called first)
   */
  static async getClipboardContent(page: Page): Promise<string> {
    return await page.evaluate(() => navigator.clipboard.readText());
  }

  /**
   * Wait for a specific number of elements to be visible
   */
  static async waitForElementCount(
    page: Page,
    selector: string,
    count: number,
    timeout: number = 5000
  ): Promise<void> {
    await page.waitForFunction(
      ({ sel, cnt }) => document.querySelectorAll(sel).length === cnt,
      { sel: selector, cnt: count },
      { timeout }
    );
  }

  /**
   * Hover over an element
   */
  static async hover(page: Page, selector: string): Promise<void> {
    await page.locator(selector).hover();
  }

  /**
   * Press keyboard key
   */
  static async pressKey(page: Page, key: string): Promise<void> {
    await page.keyboard.press(key);
  }

  /**
   * Get all text contents from multiple elements
   */
  static async getAllTextContents(
    page: Page,
    selector: string
  ): Promise<string[]> {
    return await page.locator(selector).allTextContents();
  }

  /**
   * Check if URL matches pattern
   */
  static async urlMatches(
    page: Page,
    pattern: string | RegExp
  ): Promise<boolean> {
    const url = page.url();
    if (typeof pattern === 'string') {
      return url.includes(pattern);
    }
    return pattern.test(url);
  }
}
