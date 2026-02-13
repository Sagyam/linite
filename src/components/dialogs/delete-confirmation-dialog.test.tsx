import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/component-utils';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';

const mockInstallations = [
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
      id: '1',
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
        name: 'Source 1',
        slug: 'source-1'
      }
    },
    distro: {
      id: '1',
      name: 'Distro 1',
      slug: 'distro-1',
      iconUrl: '/distro1.png'
    }
  },
  {
    id: '2',
    userId: 'user-1',
    appId: 'app-2',
    packageId: 'package2',
    distroId: 'distro-2',
    deviceIdentifier: 'Device 2',
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
      id: '2',
      displayName: 'App 2',
      slug: 'app-2',
      iconUrl: '/icon2.png'
    },
    package: {
      id: 'pkg-2',
      identifier: 'package2',
      version: '2.0.0',
      source: {
        id: 'source-2',
        name: 'Source 2',
        slug: 'source-2'
      }
    },
    distro: {
      id: '2',
      name: 'Distro 2',
      slug: 'distro-2',
      iconUrl: '/distro2.png'
    }
  }
];

describe('DeleteConfirmationDialog', () => {
  it('should render dialog when open', () => {
    renderWithProviders(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
        onConfirmDelete={vi.fn()}
        onShowUninstallCommands={vi.fn()}
      />
    );

    expect(screen.getByText('Delete 2 installations?')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    const { container } = renderWithProviders(
      <DeleteConfirmationDialog
        open={false}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
        onConfirmDelete={vi.fn()}
        onShowUninstallCommands={vi.fn()}
      />
    );

    expect(screen.queryByText('Delete 2 installations?')).not.toBeInTheDocument();
  });

  it('should display all app names when 10 or fewer installations', () => {
    renderWithProviders(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
        onConfirmDelete={vi.fn()}
        onShowUninstallCommands={vi.fn()}
      />
    );

    expect(screen.getByText('App 1')).toBeInTheDocument();
    expect(screen.getByText('App 2')).toBeInTheDocument();
  });

  it('should truncate list when more than 10 installations', () => {
    const manyInstallations = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      userId: 'user-1',
      appId: `app-${i}`,
      packageId: `package${i}`,
      distroId: 'distro-1',
      deviceIdentifier: 'Device',
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
        id: String(i),
        displayName: `App ${i}`,
        slug: `app-${i}`,
        iconUrl: '/icon.png'
      },
      package: {
        id: `pkg-${i}`,
        identifier: `package${i}`,
        version: '1.0.0',
        source: {
          id: 'source-1',
          name: 'Source',
          slug: 'source-1'
        }
      },
      distro: {
        id: '1',
        name: 'Distro',
        slug: 'distro-1',
        iconUrl: '/distro.png'
      }
    }));

    renderWithProviders(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={manyInstallations}
        onConfirmDelete={vi.fn()}
        onShowUninstallCommands={vi.fn()}
      />
    );

    expect(screen.getByText('and 5 more...')).toBeInTheDocument();
  });

  it('should display warning about permanent deletion', () => {
    renderWithProviders(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
        onConfirmDelete={vi.fn()}
        onShowUninstallCommands={vi.fn()}
      />
    );

    expect(screen.getByText(/permanently deleted/i)).toBeInTheDocument();
  });

  it('should have "Show Uninstall Commands" button', () => {
    renderWithProviders(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
        onConfirmDelete={vi.fn()}
        onShowUninstallCommands={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /show uninstall commands/i })).toBeInTheDocument();
  });

  it('should have "Just Delete" button', () => {
    renderWithProviders(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
        onConfirmDelete={vi.fn()}
        onShowUninstallCommands={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /just delete/i })).toBeInTheDocument();
  });

  it('should have "Cancel" button', () => {
    renderWithProviders(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
        onConfirmDelete={vi.fn()}
        onShowUninstallCommands={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should call onShowUninstallCommands when "Show Uninstall Commands" button is clicked', () => {
    const onShowUninstallCommands = vi.fn();

    renderWithProviders(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
        onConfirmDelete={vi.fn()}
        onShowUninstallCommands={onShowUninstallCommands}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /show uninstall commands/i }));
    expect(onShowUninstallCommands).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirmDelete when "Just Delete" button is clicked', () => {
    const onConfirmDelete = vi.fn();

    renderWithProviders(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        installations={mockInstallations}
        onConfirmDelete={onConfirmDelete}
        onShowUninstallCommands={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /just delete/i }));
    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenChange with false when "Cancel" button is clicked', () => {
    const onOpenChange = vi.fn();

    renderWithProviders(
      <DeleteConfirmationDialog
        open={true}
        onOpenChange={onOpenChange}
        installations={mockInstallations}
        onConfirmDelete={vi.fn()}
        onShowUninstallCommands={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
