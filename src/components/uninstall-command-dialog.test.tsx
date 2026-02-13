import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockGlobalFetch, createMockResponse, mockClipboard } from '../test/component-utils';
import { UninstallCommandDialog } from './uninstall-command-dialog';
import type { InstallationWithRelations } from '@/types/entities';

const mockInstallations: InstallationWithRelations[] = [
  {
    id: '1',
    userId: 'user-1',
    appId: 'app-1',
    packageId: 'package1',
    distroId: 'distro-1',
    deviceIdentifier: 'Device 1',
    installedAt: new Date(),
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    },
    app: {
      id: 'app-1',
      displayName: 'App 1',
      slug: 'app-1',
      iconUrl: '/icon1.png'
    },
    package: {
      id: 'pkg-1',
      identifier: 'package1',
      version: '1.0.0',
      source: {
        id: 'source-1',
        name: 'APT',
        slug: 'apt'
      }
    },
    distro: {
      id: 'distro-1',
      name: 'Ubuntu',
      slug: 'ubuntu',
      iconUrl: '/ubuntu.png'
    }
  },
  {
    id: '2',
    userId: 'user-1',
    appId: 'app-2',
    packageId: 'package2',
    distroId: 'distro-1',
    deviceIdentifier: 'Device 1',
    installedAt: new Date(),
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    },
    app: {
      id: 'app-2',
      displayName: 'App 2',
      slug: 'app-2',
      iconUrl: '/icon2.png'
    },
    package: {
      id: 'pkg-2',
      identifier: 'package2',
      version: '2.0.0',
      source: {
        id: 'source-1',
        name: 'APT',
        slug: 'apt'
      }
    },
    distro: {
      id: 'distro-1',
      name: 'Ubuntu',
      slug: 'ubuntu',
      iconUrl: '/ubuntu.png'
    }
  }
];

const mockMixedDistroInstallations: InstallationWithRelations[] = [
  mockInstallations[0],
  {
    ...mockInstallations[1],
    distroId: 'distro-2',
    distro: {
      id: 'distro-2',
      name: 'Fedora',
      slug: 'fedora',
      iconUrl: '/fedora.png'
    }
  }
];

const mockUninstallResponse = {
  commands: ['sudo apt remove package1 package2 -y'],
  cleanupCommands: ['sudo apt-add-repository --remove ppa:example/ppa'],
  dependencyCleanupCommands: ['sudo apt autoremove -y'],
  warnings: ['Warning: This will remove the package'],
  breakdown: [
    {
      source: 'APT',
      packages: ['package1', 'package2']
    }
  ],
  manualSteps: []
};

describe('UninstallCommandDialog', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let clipboard: ReturnType<typeof mockClipboard>;

  beforeEach(() => {
    mockFetch = mockGlobalFetch();
    clipboard = mockClipboard();
    clipboard.writeText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render dialog when closed', () => {
    renderWithProviders(
      <UninstallCommandDialog
        open={false}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    expect(screen.queryByText('Uninstall Commands')).not.toBeInTheDocument();
  });

  it('should render dialog when open', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockUninstallResponse, 200, true)
    );

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    expect(screen.getByText('Uninstall Commands')).toBeInTheDocument();
  });

  it('should show error for mixed distros', () => {
    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockMixedDistroInstallations}
      />
    );

    expect(screen.getByText('Cannot Generate Uninstall Commands')).toBeInTheDocument();
    expect(screen.getByText('Mixed distributions detected')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    // The skeleton loader should be visible
    expect(screen.getByText('Uninstall Commands')).toBeInTheDocument();
  });

  it('should call API with correct parameters', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockUninstallResponse, 200, true)
    );

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/uninstall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distroSlug: 'ubuntu',
          appIds: ['app-1', 'app-2'],
          sourcePreference: 'apt',
          includeDependencyCleanup: false,
          includeSetupCleanup: false,
        }),
      });
    });
  });

  it('should display uninstall commands on success', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockUninstallResponse, 200, true)
    );

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('sudo apt remove package1 package2 -y')).toBeInTheDocument();
    });
  });

  it('should display setup cleanup commands', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockUninstallResponse, 200, true)
    );

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Setup Cleanup')).toBeInTheDocument();
      expect(screen.getByText('sudo apt-add-repository --remove ppa:example/ppa')).toBeInTheDocument();
    });
  });

  it('should display dependency cleanup commands', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockUninstallResponse, 200, true)
    );

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Dependency Cleanup')).toBeInTheDocument();
      expect(screen.getByText('sudo apt autoremove -y')).toBeInTheDocument();
    });
  });

  it('should display warnings', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockUninstallResponse, 200, true)
    );

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    // First wait for the commands to load
    await waitFor(() => {
      expect(screen.getByText('sudo apt remove package1 package2 -y')).toBeInTheDocument();
    });

    // Then check for warnings
    await waitFor(() => {
      expect(screen.getByText(/Warning:.*remove the package/)).toBeInTheDocument();
    });
  });

  it('should show error state when API fails', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ error: 'Failed to generate commands' }, 400, false)
    );

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to generate uninstall commands')).toBeInTheDocument();
    });
  });

  it('should handle copy all button', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockUninstallResponse, 200, true)
    );

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('sudo apt remove package1 package2 -y')).toBeInTheDocument();
    });

    // Find and click the Copy button in the header (not in command blocks)
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    const headerCopyButton = copyButtons[0]; // First copy button is in header

    fireEvent.click(headerCopyButton);

    await waitFor(() => {
      expect(clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('should show correct distro name in description', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockUninstallResponse, 200, true)
    );

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Ubuntu/)).toBeInTheDocument();
    });
  });

  it('should show correct app count in header', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(mockUninstallResponse, 200, true)
    );

    renderWithProviders(
      <UninstallCommandDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
      />
    );

    // Wait for data to load first
    await waitFor(() => {
      expect(screen.getByText('sudo apt remove package1 package2 -y')).toBeInTheDocument();
    });

    // Then check for app count
    await waitFor(() => {
      expect(screen.getByText(/2 apps selected/)).toBeInTheDocument();
    });
  });
});
