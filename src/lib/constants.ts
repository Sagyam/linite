export const APP_NAME = 'Linite';
export const APP_DESCRIPTION = 'A Ninite-style bulk package installer for Linux distributions';

export const SOURCE_PREFERENCES = ['auto', 'flatpak', 'native', 'snap'] as const;
export type SourcePreference = typeof SOURCE_PREFERENCES[number];

export const DISTRO_FAMILIES = ['debian', 'rhel', 'arch', 'suse', 'independent'] as const;
export type DistroFamily = typeof DISTRO_FAMILIES[number];

export const USER_ROLES = ['admin', 'superadmin'] as const;
export type UserRole = typeof USER_ROLES[number];
