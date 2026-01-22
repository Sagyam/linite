import { describe, it, expect } from 'vitest';
import { bulkDeleteInstallationsSchema } from './installation.schema';

describe('bulkDeleteInstallationsSchema', () => {
  describe('valid input', () => {
    it('should accept valid input with single installation ID', () => {
      const input = {
        installationIds: ['install-1'],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installationIds).toEqual(['install-1']);
      }
    });

    it('should accept valid input with multiple installation IDs', () => {
      const input = {
        installationIds: ['install-1', 'install-2', 'install-3'],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installationIds).toHaveLength(3);
      }
    });

    it('should accept large array of installation IDs', () => {
      const input = {
        installationIds: Array.from({ length: 100 }, (_, i) => `install-${i}`),
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installationIds).toHaveLength(100);
      }
    });

    it('should accept valid installation IDs with special characters', () => {
      const input = {
        installationIds: ['install-with-dash', 'install.with.dots', 'install@with@at'],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installationIds).toContain('install-with-dash');
        expect(result.data.installationIds).toContain('install.with.dots');
        expect(result.data.installationIds).toContain('install@with@at');
      }
    });

    it('should accept installation IDs with CUID2 format', () => {
      const input = {
        installationIds: ['clh1a2b3c4d5e6f7g8h9i0j1', 'clh2a3b4c5d6e7f8g9h0i1j2'],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installationIds).toHaveLength(2);
      }
    });
  });

  describe('invalid input', () => {
    it('should reject empty installationIds array', () => {
      const input = {
        installationIds: [],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one installation is required');
      }
    });

    it('should reject empty string in installationIds array', () => {
      const input = {
        installationIds: [''],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Installation ID cannot be empty');
      }
    });

    it('should reject array with empty string among valid IDs', () => {
      const input = {
        installationIds: ['install-1', '', 'install-3'],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject missing installationIds field', () => {
      const input = {};

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject non-array installationIds', () => {
      const input = {
        installationIds: 'install-1',
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject array with non-string values', () => {
      const input = {
        installationIds: ['install-1', 123, 'install-3'],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject array with null values', () => {
      const input = {
        installationIds: ['install-1', null, 'install-3'],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject array with undefined values', () => {
      const input = {
        installationIds: ['install-1', undefined, 'install-3'],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject null installationIds', () => {
      const input = {
        installationIds: null,
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject undefined installationIds', () => {
      const input = {
        installationIds: undefined,
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should accept whitespace-only installation ID', () => {
      const input = {
        installationIds: ['   '],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installationIds[0]).toBe('   ');
      }
    });

    it('should accept array with duplicate installation IDs', () => {
      const input = {
        installationIds: ['install-1', 'install-1', 'install-2'],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installationIds).toHaveLength(3);
      }
    });

    it('should accept very long installation IDs', () => {
      const longId = 'install-'.repeat(100);
      const input = {
        installationIds: [longId],
      };

      const result = bulkDeleteInstallationsSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installationIds[0]).toBe(longId);
      }
    });

    it('should not accept non-object input', () => {
      const result = bulkDeleteInstallationsSchema.safeParse(null);

      expect(result.success).toBe(false);
    });

    it('should not accept string input', () => {
      const result = bulkDeleteInstallationsSchema.safeParse('invalid');

      expect(result.success).toBe(false);
    });
  });
});
