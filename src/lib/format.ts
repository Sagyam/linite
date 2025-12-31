/**
 * Utility functions for formatting data
 */

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return 'Unknown';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'Unknown';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear > 0) return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
  if (diffMonth > 0) return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
  if (diffDay > 0) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  if (diffHour > 0) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  if (diffMin > 0) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  return 'Just now';
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Unknown';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
