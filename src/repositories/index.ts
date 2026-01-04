/**
 * Repository Layer Barrel Export
 * Centralized data access layer
 */

export * from './base.repository';
export * from './apps.repository';
export * from './categories.repository';
export * from './distros.repository';
export * from './sources.repository';

// Re-export singleton instances for convenience
export { appsRepository } from './apps.repository';
export { categoriesRepository } from './categories.repository';
export { distrosRepository } from './distros.repository';
export { sourcesRepository } from './sources.repository';
