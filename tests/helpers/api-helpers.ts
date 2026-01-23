import { type APIRequestContext, type APIResponse } from '@playwright/test';

/**
 * API Helpers - Utilities for testing API endpoints
 *
 * These helpers provide reusable functions for making API requests,
 * validating responses, and handling authentication in API tests.
 */

export class ApiHelpers {
  /**
   * Make authenticated API request
   * @param request - Playwright API request context
   * @param endpoint - API endpoint path
   * @param options - Request options (method, data, etc.)
   * @param token - Authentication token
   * @returns API response
   */
  static async authenticatedRequest(
    request: APIRequestContext,
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      data?: any;
      params?: Record<string, string>;
    } = {},
    token: string = 'test-auth-token'
  ): Promise<APIResponse> {
    const { method = 'GET', data, params } = options;

    const config: any = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.data = data;
    }

    if (params) {
      config.params = params;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}${endpoint}`;

    switch (method) {
      case 'GET':
        return await request.get(url, config);
      case 'POST':
        return await request.post(url, config);
      case 'PUT':
        return await request.put(url, config);
      case 'DELETE':
        return await request.delete(url, config);
      case 'PATCH':
        return await request.patch(url, config);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  /**
   * Validate response status code
   * @param response - API response
   * @param expectedStatus - Expected status code
   * @throws Error if status doesn't match
   */
  static validateStatus(response: APIResponse, expectedStatus: number): void {
    const actualStatus = response.status();
    if (actualStatus !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${actualStatus}. ` +
        `Response: ${JSON.stringify(response)}`
      );
    }
  }

  /**
   * Validate response has required fields
   * @param data - Response data
   * @param requiredFields - Array of required field names
   * @throws Error if any field is missing
   */
  static validateRequiredFields(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter((field) => !(field in data));

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields: ${missingFields.join(', ')}. ` +
        `Data: ${JSON.stringify(data)}`
      );
    }
  }

  /**
   * Validate response is success (2xx status)
   * @param response - API response
   * @throws Error if not success
   */
  static async validateSuccess(response: APIResponse): Promise<void> {
    const status = response.status();
    if (status < 200 || status >= 300) {
      const body = await response.text();
      throw new Error(
        `Request failed with status ${status}. Response: ${body}`
      );
    }
  }

  /**
   * Validate response is error (4xx or 5xx status)
   * @param response - API response
   * @param expectedStatus - Expected error status (optional)
   * @throws Error if not error
   */
  static validateError(
    response: APIResponse,
    expectedStatus?: number
  ): void {
    const status = response.status();

    if (expectedStatus && status !== expectedStatus) {
      throw new Error(
        `Expected error status ${expectedStatus}, got ${status}`
      );
    }

    if (status < 400) {
      throw new Error(
        `Expected error status (4xx or 5xx), got ${status}`
      );
    }
  }

  /**
   * Parse JSON response
   * @param response - API response
   * @returns Parsed JSON data
   */
  static async parseJson<T = any>(response: APIResponse): Promise<T> {
    try {
      return await response.json();
    } catch (error) {
      const text = await response.text();
      throw new Error(
        `Failed to parse JSON response. Body: ${text}. Error: ${error}`
      );
    }
  }

  /**
   * Validate pagination response structure
   * @param data - Response data
   */
  static validatePaginationResponse(data: any): void {
    this.validateRequiredFields(data, ['data', 'page', 'pageSize', 'total']);

    if (!Array.isArray(data.data)) {
      throw new Error('Pagination data should be an array');
    }

    if (typeof data.page !== 'number' || data.page < 1) {
      throw new Error('Invalid page number');
    }

    if (typeof data.pageSize !== 'number' || data.pageSize < 1) {
      throw new Error('Invalid pageSize');
    }

    if (typeof data.total !== 'number' || data.total < 0) {
      throw new Error('Invalid total');
    }
  }

  /**
   * Validate error response structure
   * @param data - Response data
   */
  static validateErrorResponse(data: any): void {
    if (!data.error && !data.message) {
      throw new Error(
        'Error response should have "error" or "message" field'
      );
    }
  }

  /**
   * Make request with retry logic
   * @param request - Playwright API request context
   * @param endpoint - API endpoint path
   * @param options - Request options
   * @param maxRetries - Maximum number of retries
   * @returns API response
   */
  static async requestWithRetry(
    request: APIRequestContext,
    endpoint: string,
    options: any = {},
    maxRetries: number = 3
  ): Promise<APIResponse> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.authenticatedRequest(request, endpoint, options);
      } catch (error) {
        lastError = error as Error;
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Validate response time is within acceptable range
   * @param startTime - Request start time
   * @param maxDuration - Maximum acceptable duration in ms
   * @throws Error if duration exceeds max
   */
  static validateResponseTime(startTime: number, maxDuration: number): void {
    const duration = Date.now() - startTime;
    if (duration > maxDuration) {
      throw new Error(
        `Response time ${duration}ms exceeds maximum ${maxDuration}ms`
      );
    }
  }

  /**
   * Create test app via API
   * Helper for setting up test data
   */
  static async createTestApp(
    request: APIRequestContext,
    appData: {
      name: string;
      slug: string;
      description?: string;
      category?: string;
    }
  ): Promise<any> {
    const response = await this.authenticatedRequest(request, '/api/apps', {
      method: 'POST',
      data: {
        name: appData.name,
        slug: appData.slug,
        description: appData.description || 'Test app',
        categoryId: appData.category || 'browsers',
        homepageUrl: 'https://example.com',
        iconUrl: 'https://example.com/icon.png',
      },
    });

    await this.validateSuccess(response);
    return await this.parseJson(response);
  }

  /**
   * Delete test app via API
   * Helper for cleaning up test data
   */
  static async deleteTestApp(
    request: APIRequestContext,
    appId: string
  ): Promise<void> {
    const response = await this.authenticatedRequest(
      request,
      `/api/apps/${appId}`,
      { method: 'DELETE' }
    );

    await this.validateSuccess(response);
  }

  /**
   * Generate install command via API
   */
  static async generateInstallCommand(
    request: APIRequestContext,
    appIds: string[],
    distroId: string,
    sourcePreference?: string
  ): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await request.post(`${baseUrl}/api/generate`, {
      data: {
        appIds,
        distroId,
        sourcePreference,
      },
    });

    await this.validateSuccess(response);
    return await this.parseJson(response);
  }

  /**
   * Search apps via API
   */
  static async searchApps(
    request: APIRequestContext,
    query: string,
    filters?: {
      category?: string;
      popular?: boolean;
    }
  ): Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const params = new URLSearchParams({ q: query });

    if (filters?.category) {
      params.append('category', filters.category);
    }

    if (filters?.popular) {
      params.append('popular', 'true');
    }

    const response = await request.get(
      `${baseUrl}/api/search?${params.toString()}`
    );

    await this.validateSuccess(response);
    return await this.parseJson(response);
  }

  /**
   * Wait for API endpoint to be ready
   * Useful during test setup
   */
  static async waitForEndpoint(
    request: APIRequestContext,
    endpoint: string,
    maxAttempts: number = 10
  ): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await request.get(`${baseUrl}${endpoint}`);
        if (response.ok()) {
          return;
        }
      } catch {
        // Ignore errors and retry
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error(`Endpoint ${endpoint} not ready after ${maxAttempts} attempts`);
  }
}
