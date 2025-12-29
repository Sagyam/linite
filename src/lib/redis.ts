import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { env } from '@/lib/env';

// Initialize Redis client only if configured
const redis = env.KV_REST_API_URL && env.KV_REST_API_TOKEN
  ? new Redis({
      url: env.KV_REST_API_URL,
      token: env.KV_REST_API_TOKEN,
    })
  : null;

// Rate limit configurations for different endpoint types
// Only create limiters if Redis is configured
// In development, use more generous limits for testing

const isDevelopment = env.NODE_ENV === 'development';

// Public API endpoints
// Development: 100/min, Production: 30/min
export const publicApiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(isDevelopment ? 100 : 30, '1 m'),
      analytics: true,
      prefix: '@ratelimit/public',
    })
  : null;

// Generate endpoint (resource intensive)
// Development: 50/min, Production: 10/min
export const generateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(isDevelopment ? 50 : 10, '1 m'),
      analytics: true,
      prefix: '@ratelimit/generate',
    })
  : null;

// Search endpoint
// Development: 100/min, Production: 20/min
export const searchLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(isDevelopment ? 100 : 20, '1 m'),
      analytics: true,
      prefix: '@ratelimit/search',
    })
  : null;

// Admin endpoints (already auth-protected)
// Development: 200/min, Production: 100/min
export const adminLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(isDevelopment ? 200 : 100, '1 m'),
      analytics: true,
      prefix: '@ratelimit/admin',
    })
  : null;

export { redis };
