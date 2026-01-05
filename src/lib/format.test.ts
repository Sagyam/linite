import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatBytes, formatRelativeTime, formatDate } from './format';

describe('format utilities', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('Unknown');
      expect(formatBytes(500)).toBe('500.0 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1.0 MB');
      expect(formatBytes(1572864)).toBe('1.5 MB');
      expect(formatBytes(1073741824)).toBe('1.0 GB');
      expect(formatBytes(1610612736)).toBe('1.5 GB');
      expect(formatBytes(1099511627776)).toBe('1.0 TB');
    });

    it('should handle null and undefined', () => {
      expect(formatBytes(null)).toBe('Unknown');
      expect(formatBytes(undefined)).toBe('Unknown');
    });

    it('should handle edge cases', () => {
      expect(formatBytes(1)).toBe('1.0 B');
      expect(formatBytes(1023)).toBe('1023.0 B');
      expect(formatBytes(1025)).toBe('1.0 KB');
    });

    it('should round to one decimal place', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1638)).toBe('1.6 KB'); // 1638 / 1024 = 1.6
      expect(formatBytes(1741)).toBe('1.7 KB'); // 1741 / 1024 = 1.7
    });

    it('should handle very large sizes', () => {
      expect(formatBytes(5497558138880)).toBe('5.0 TB'); // 5 TB
      expect(formatBytes(1099511627776 * 10)).toBe('10.0 TB'); // 10 TB
    });

    it('should handle very small sizes', () => {
      expect(formatBytes(1)).toBe('1.0 B');
      expect(formatBytes(10)).toBe('10.0 B');
      expect(formatBytes(100)).toBe('100.0 B');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock current time to 2024-01-15 12:00:00
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format "just now" for recent times', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      expect(formatRelativeTime(now)).toBe('Just now');

      const fiveSecondsAgo = new Date('2024-01-15T11:59:55Z');
      expect(formatRelativeTime(fiveSecondsAgo)).toBe('Just now');

      const thirtySecondsAgo = new Date('2024-01-15T11:59:30Z');
      expect(formatRelativeTime(thirtySecondsAgo)).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const oneMinuteAgo = new Date('2024-01-15T11:59:00Z');
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');

      const fiveMinutesAgo = new Date('2024-01-15T11:55:00Z');
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');

      const thirtyMinutesAgo = new Date('2024-01-15T11:30:00Z');
      expect(formatRelativeTime(thirtyMinutesAgo)).toBe('30 minutes ago');
    });

    it('should format hours ago', () => {
      const oneHourAgo = new Date('2024-01-15T11:00:00Z');
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');

      const threeHoursAgo = new Date('2024-01-15T09:00:00Z');
      expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');

      const twelveHoursAgo = new Date('2024-01-15T00:00:00Z');
      expect(formatRelativeTime(twelveHoursAgo)).toBe('12 hours ago');
    });

    it('should format days ago', () => {
      const oneDayAgo = new Date('2024-01-14T12:00:00Z');
      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');

      const threeDaysAgo = new Date('2024-01-12T12:00:00Z');
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');

      const sevenDaysAgo = new Date('2024-01-08T12:00:00Z');
      expect(formatRelativeTime(sevenDaysAgo)).toBe('7 days ago');
    });

    it('should format months ago', () => {
      const oneMonthAgo = new Date('2023-12-15T12:00:00Z');
      expect(formatRelativeTime(oneMonthAgo)).toBe('1 month ago');

      const twoMonthsAgo = new Date('2023-11-15T12:00:00Z');
      expect(formatRelativeTime(twoMonthsAgo)).toBe('2 months ago');

      const sixMonthsAgo = new Date('2023-07-15T12:00:00Z');
      expect(formatRelativeTime(sixMonthsAgo)).toBe('6 months ago');
    });

    it('should format years ago', () => {
      const oneYearAgo = new Date('2023-01-15T12:00:00Z');
      expect(formatRelativeTime(oneYearAgo)).toBe('1 year ago');

      const twoYearsAgo = new Date('2022-01-15T12:00:00Z');
      expect(formatRelativeTime(twoYearsAgo)).toBe('2 years ago');

      const fiveYearsAgo = new Date('2019-01-15T12:00:00Z');
      expect(formatRelativeTime(fiveYearsAgo)).toBe('5 years ago');
    });

    it('should handle null and undefined', () => {
      expect(formatRelativeTime(null)).toBe('Unknown');
      expect(formatRelativeTime(undefined)).toBe('Unknown');
    });

    it('should handle string dates', () => {
      const dateString = '2024-01-14T12:00:00Z';
      expect(formatRelativeTime(dateString)).toBe('1 day ago');

      const isoString = new Date('2024-01-12T12:00:00Z').toISOString();
      expect(formatRelativeTime(isoString)).toBe('3 days ago');
    });

    it('should use singular form for 1 unit', () => {
      expect(formatRelativeTime(new Date('2024-01-15T11:59:00Z'))).toBe(
        '1 minute ago'
      );
      expect(formatRelativeTime(new Date('2024-01-15T11:00:00Z'))).toBe(
        '1 hour ago'
      );
      expect(formatRelativeTime(new Date('2024-01-14T12:00:00Z'))).toBe(
        '1 day ago'
      );
      expect(formatRelativeTime(new Date('2023-12-15T12:00:00Z'))).toBe(
        '1 month ago'
      );
      expect(formatRelativeTime(new Date('2023-01-15T12:00:00Z'))).toBe(
        '1 year ago'
      );
    });

    it('should use plural form for multiple units', () => {
      expect(formatRelativeTime(new Date('2024-01-15T11:58:00Z'))).toBe(
        '2 minutes ago'
      );
      expect(formatRelativeTime(new Date('2024-01-15T10:00:00Z'))).toBe(
        '2 hours ago'
      );
      expect(formatRelativeTime(new Date('2024-01-13T12:00:00Z'))).toBe(
        '2 days ago'
      );
      expect(formatRelativeTime(new Date('2023-11-15T12:00:00Z'))).toBe(
        '2 months ago'
      );
      expect(formatRelativeTime(new Date('2022-01-15T12:00:00Z'))).toBe(
        '2 years ago'
      );
    });

    it('should prioritize larger units', () => {
      // 25 hours ago should show as "1 day ago" not "25 hours ago"
      const twentyFiveHoursAgo = new Date('2024-01-14T11:00:00Z');
      expect(formatRelativeTime(twentyFiveHoursAgo)).toBe('1 day ago');

      // 35 days ago should show as "1 month ago" not "35 days ago"
      const thirtyFiveDaysAgo = new Date('2023-12-11T12:00:00Z');
      expect(formatRelativeTime(thirtyFiveDaysAgo)).toBe('1 month ago');
    });
  });

  describe('formatDate', () => {
    it('should format Date objects', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = formatDate(date);

      // Should contain year, month, and day
      expect(formatted).toContain('2024');
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
    });

    it('should format string dates', () => {
      const dateString = '2024-06-20T10:30:00Z';
      const formatted = formatDate(dateString);

      expect(formatted).toContain('2024');
      expect(formatted).toContain('June');
      expect(formatted).toContain('20');
    });

    it('should handle null and undefined', () => {
      expect(formatDate(null)).toBe('Unknown');
      expect(formatDate(undefined)).toBe('Unknown');
    });

    it('should format different months correctly', () => {
      const months = [
        { date: '2024-01-01', month: 'January' },
        { date: '2024-02-01', month: 'February' },
        { date: '2024-03-01', month: 'March' },
        { date: '2024-04-01', month: 'April' },
        { date: '2024-05-01', month: 'May' },
        { date: '2024-06-01', month: 'June' },
        { date: '2024-07-01', month: 'July' },
        { date: '2024-08-01', month: 'August' },
        { date: '2024-09-01', month: 'September' },
        { date: '2024-10-01', month: 'October' },
        { date: '2024-11-01', month: 'November' },
        { date: '2024-12-01', month: 'December' },
      ];

      months.forEach(({ date, month }) => {
        const formatted = formatDate(date);
        expect(formatted).toContain(month);
        expect(formatted).toContain('2024');
      });
    });

    it('should format historical dates', () => {
      const date = new Date('2000-01-01T00:00:00Z');
      const formatted = formatDate(date);

      expect(formatted).toContain('2000');
      expect(formatted).toContain('January');
      expect(formatted).toContain('1');
    });

    it('should format future dates', () => {
      const date = new Date('2030-12-31T12:00:00Z');
      const formatted = formatDate(date);

      expect(formatted).toContain('2030');
      expect(formatted).toContain('December');
      // Day might be 31 or 1 depending on timezone, so just check year and month
    });

    it('should handle edge case dates', () => {
      // Leap year
      const leapDay = new Date('2024-02-29T00:00:00Z');
      const formattedLeap = formatDate(leapDay);
      expect(formattedLeap).toContain('February');
      expect(formattedLeap).toContain('29');

      // Year boundary
      const newYear = new Date('2024-01-01T00:00:00Z');
      const formattedNewYear = formatDate(newYear);
      expect(formattedNewYear).toContain('January');
      expect(formattedNewYear).toContain('1');
      expect(formattedNewYear).toContain('2024');
    });

    it('should use consistent date format', () => {
      const date1 = formatDate(new Date('2024-03-15T12:00:00Z'));
      const date2 = formatDate(new Date('2024-06-20T15:30:00Z'));

      // Both should follow same pattern (contain full month name and year)
      expect(date1).toMatch(/[A-Z][a-z]+ \d{1,2}, \d{4}/);
      expect(date2).toMatch(/[A-Z][a-z]+ \d{1,2}, \d{4}/);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical package metadata formatting', () => {
      const packageSize = 52428800; // 50 MB
      const lastChecked = new Date(Date.now() - 3600000); // 1 hour ago

      expect(formatBytes(packageSize)).toBe('50.0 MB');
      // Note: relative time will depend on current time in test
    });

    it('should handle zero/null values consistently', () => {
      expect(formatBytes(0)).toBe('Unknown');
      expect(formatBytes(null)).toBe('Unknown');
      expect(formatRelativeTime(null)).toBe('Unknown');
      expect(formatDate(null)).toBe('Unknown');
    });

    it('should format package information display', () => {
      const size = 10485760; // 10 MB
      const updated = new Date('2024-01-10T12:00:00Z');

      const sizeStr = formatBytes(size);
      const dateStr = formatDate(updated);

      expect(sizeStr).toContain('MB');
      expect(dateStr).toContain('2024');
      expect(dateStr).toContain('January');
    });
  });
});
