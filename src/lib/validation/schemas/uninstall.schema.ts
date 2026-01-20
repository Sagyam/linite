import { z } from 'zod';

export const generateUninstallCommandSchema = z.object({
  distroSlug: z.string().min(1, 'Distro slug is required'),
  appIds: z
    .array(z.string())
    .min(1, 'At least one app ID is required')
    .max(100, 'Cannot uninstall more than 100 apps at once'),
  sourcePreference: z.string().optional(),
  nixosInstallMethod: z
    .enum(['nix-shell', 'nix-env', 'nix-flakes'])
    .optional(),
  includeDependencyCleanup: z.boolean().default(false),
  includeSetupCleanup: z.boolean().default(false),
});

export type GenerateUninstallCommandInput = z.infer<typeof generateUninstallCommandSchema>;
