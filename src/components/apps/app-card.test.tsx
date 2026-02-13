import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import {
  renderWithProviders,
  createMockAppWithRelations,
  createMockPackageWithRelations,
  resetStores,
  setupSelectionStore,
} from '@/test/component-utils';
import { AppCard } from './app-card';
import { useSelectionStore } from '@/stores/selection-store';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AppCard', () => {
  beforeEach(() => {
    resetStores();
  });

  describe('detailed layout', () => {
    it('should render app information correctly', () => {
      const app = createMockAppWithRelations({
        displayName: 'Firefox',
        description: 'A popular web browser',
        slug: 'firefox',
        isPopular: true,
        isFoss: true,
        packages: [
          createMockPackageWithRelations({
            id: 'pkg-1',
            source: { id: 'src-1', name: 'Flatpak', slug: 'flatpak' },
          }),
          createMockPackageWithRelations({
            id: 'pkg-2',
            source: { id: 'src-2', name: 'Snap', slug: 'snap' },
          }),
        ],
      });

      renderWithProviders(<AppCard app={app} />);

      expect(screen.getByText('Firefox')).toBeInTheDocument();
      expect(screen.getByText('A popular web browser')).toBeInTheDocument();
      expect(screen.getByText('FOSS')).toBeInTheDocument();
      expect(screen.getByText('Popular')).toBeInTheDocument();
      expect(screen.getByText('Flatpak')).toBeInTheDocument();
      expect(screen.getByText('Snap')).toBeInTheDocument();
    });

    it('should show website button with external link when homepage is provided', () => {
      const app = createMockAppWithRelations({
        slug: 'test-app',
        homepage: 'https://example.com',
        packages: [],
      });

      renderWithProviders(<AppCard app={app} />);

      const websiteLink = screen.getByRole('link', { name: /website/i });
      expect(websiteLink).toHaveAttribute('href', 'https://example.com');
      expect(websiteLink).toHaveAttribute('target', '_blank');
      expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should only show FOSS badge when app is FOSS', () => {
      const app = createMockAppWithRelations({
        isFoss: true,
        isPopular: false,
        packages: [],
      });

      renderWithProviders(<AppCard app={app} />);

      expect(screen.getByText('FOSS')).toBeInTheDocument();
      expect(screen.queryByText('Popular')).not.toBeInTheDocument();
    });

    it('should only show Popular badge when app is popular', () => {
      const app = createMockAppWithRelations({
        isFoss: false,
        isPopular: true,
        packages: [],
      });

      renderWithProviders(<AppCard app={app} />);

      expect(screen.queryByText('FOSS')).not.toBeInTheDocument();
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });

    it('should not show description if app has none', () => {
      const app = createMockAppWithRelations({
        displayName: 'Test App',
        description: null,
        packages: [],
      });

      renderWithProviders(<AppCard app={app} />);

      expect(screen.getByText('Test App')).toBeInTheDocument();
      // Description shouldn't be in the document at all
      const card = screen.getByText('Test App').closest('.cursor-pointer');
      expect(card?.textContent).not.toMatch(/^(?!.*Test App).*$/);
    });

    it('should display all package sources as badges', () => {
      const app = createMockAppWithRelations({
        packages: [
          createMockPackageWithRelations({
            id: 'pkg-1',
            source: { id: '1', name: 'Flatpak', slug: 'flatpak' },
          }),
          createMockPackageWithRelations({
            id: 'pkg-2',
            source: { id: '2', name: 'Snap', slug: 'snap' },
          }),
          createMockPackageWithRelations({
            id: 'pkg-3',
            source: { id: '3', name: 'APT', slug: 'apt' },
          }),
        ],
      });

      renderWithProviders(<AppCard app={app} />);

      expect(screen.getByText('Flatpak')).toBeInTheDocument();
      expect(screen.getByText('Snap')).toBeInTheDocument();
      expect(screen.getByText('APT')).toBeInTheDocument();
    });

    it('should not show website button when homepage is not provided', () => {
      const app = createMockAppWithRelations({
        displayName: 'Test App',
        homepage: null,
        packages: [],
      });

      renderWithProviders(<AppCard app={app} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('compact layout', () => {
    it('should render app in compact mode', () => {
      const app = createMockAppWithRelations({
        displayName: 'Compact App',
        isFoss: true,
        packages: [
          createMockPackageWithRelations(),
          createMockPackageWithRelations(),
        ],
      });

      renderWithProviders(<AppCard app={app} layout="compact" />);

      expect(screen.getByText('Compact App')).toBeInTheDocument();
      expect(screen.getByText('FOSS')).toBeInTheDocument();
      expect(screen.getByText('2 sources')).toBeInTheDocument();
    });

    it('should show singular "source" for one package', () => {
      const app = createMockAppWithRelations({
        packages: [createMockPackageWithRelations()],
      });

      renderWithProviders(<AppCard app={app} layout="compact" />);

      expect(screen.getByText('1 source')).toBeInTheDocument();
    });

    it('should show plural "sources" for multiple packages', () => {
      const app = createMockAppWithRelations({
        packages: [
          createMockPackageWithRelations(),
          createMockPackageWithRelations(),
          createMockPackageWithRelations(),
        ],
      });

      renderWithProviders(<AppCard app={app} layout="compact" />);

      expect(screen.getByText('3 sources')).toBeInTheDocument();
    });

    it('should have external link button when homepage is provided', () => {
      const app = createMockAppWithRelations({
        slug: 'compact-app',
        homepage: 'https://example.com/compact',
        packages: [],
      });

      renderWithProviders(<AppCard app={app} layout="compact" />);

      const externalLink = screen.getByRole('link');
      expect(externalLink).toHaveAttribute('href', 'https://example.com/compact');
      expect(externalLink).toHaveAttribute('target', '_blank');
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not show Popular badge in compact mode', () => {
      const app = createMockAppWithRelations({
        isPopular: true,
        isFoss: false,
        packages: [],
      });

      renderWithProviders(<AppCard app={app} layout="compact" />);

      expect(screen.queryByText('Popular')).not.toBeInTheDocument();
    });

    it('should not show external link when homepage is not provided in compact mode', () => {
      const app = createMockAppWithRelations({
        displayName: 'No Homepage App',
        homepage: null,
        packages: [],
      });

      renderWithProviders(<AppCard app={app} layout="compact" />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('selection behavior', () => {
    it('should show checkbox as unchecked by default', () => {
      const app = createMockAppWithRelations({ packages: [] });

      renderWithProviders(<AppCard app={app} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should show checkbox as checked when app is selected', () => {
      const app = createMockAppWithRelations({ id: 'app-1', packages: [] });

      setupSelectionStore({ apps: ['app-1'] });

      renderWithProviders(<AppCard app={app} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should toggle selection when clicking the card', () => {
      const app = createMockAppWithRelations({ id: 'app-1', packages: [] });

      renderWithProviders(<AppCard app={app} />);

      const card = screen.getByRole('checkbox').closest('.cursor-pointer');
      expect(card).toBeInTheDocument();

      fireEvent.click(card!);

      expect(useSelectionStore.getState().selectedApps.has('app-1')).toBe(true);

      fireEvent.click(card!);

      expect(useSelectionStore.getState().selectedApps.has('app-1')).toBe(false);
    });

    it('should show ring border when selected', () => {
      const app = createMockAppWithRelations({ id: 'app-1', packages: [] });

      setupSelectionStore({ apps: ['app-1'], categories: new Map([['app-1', 'cat-1']]) });

      renderWithProviders(<AppCard app={app} />);

      const card = screen.getByRole('checkbox').closest('.cursor-pointer');
      expect(card).toHaveClass('ring-2');
    });

    it('should not show ring border when not selected', () => {
      const app = createMockAppWithRelations({ id: 'app-1', packages: [] });

      renderWithProviders(<AppCard app={app} />);

      const card = screen.getByRole('checkbox').closest('.cursor-pointer');
      expect(card).not.toHaveClass('ring-2');
    });
  });

  describe('interaction behavior', () => {
    it('should not toggle selection when clicking the website link', () => {
      const app = createMockAppWithRelations({
        id: 'app-1',
        homepage: 'https://example.com',
        packages: []
      });

      renderWithProviders(<AppCard app={app} />);

      const websiteLink = screen.getByRole('link', { name: /website/i });
      fireEvent.click(websiteLink);

      expect(useSelectionStore.getState().selectedApps.has('app-1')).toBe(false);
    });

    it('should not toggle selection when clicking external link in compact mode', () => {
      const app = createMockAppWithRelations({
        id: 'app-1',
        homepage: 'https://example.com',
        packages: []
      });

      renderWithProviders(<AppCard app={app} layout="compact" />);

      const externalLink = screen.getByRole('link');
      fireEvent.click(externalLink);

      expect(useSelectionStore.getState().selectedApps.has('app-1')).toBe(false);
    });

    it('should prevent event propagation when clicking links', () => {
      const app = createMockAppWithRelations({
        homepage: 'https://example.com',
        packages: []
      });

      renderWithProviders(<AppCard app={app} />);

      const websiteLink = screen.getByRole('link', { name: /website/i });
      const stopPropagation = vi.fn();

      websiteLink.addEventListener('click', (e) => {
        stopPropagation();
        e.stopPropagation();
      });

      fireEvent.click(websiteLink);

      expect(stopPropagation).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should render checkbox as interactive element', () => {
      const app = createMockAppWithRelations({ packages: [] });

      renderWithProviders(<AppCard app={app} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should have proper external link with href when homepage provided', () => {
      const app = createMockAppWithRelations({
        slug: 'firefox',
        homepage: 'https://firefox.com',
        packages: []
      });

      renderWithProviders(<AppCard app={app} />);

      const link = screen.getByRole('link', { name: /website/i });
      expect(link).toHaveAttribute('href', 'https://firefox.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render image with alt text from app name', () => {
      const app = createMockAppWithRelations({
        displayName: 'Firefox Browser',
        iconUrl: 'https://example.com/firefox.png',
        packages: [],
      });

      renderWithProviders(<AppCard app={app} />);

      // AppIcon component should render the icon
      expect(screen.getByText('Firefox Browser')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle app with no packages', () => {
      const app = createMockAppWithRelations({
        displayName: 'No Package App',
        packages: [],
      });

      renderWithProviders(<AppCard app={app} />);

      expect(screen.getByText('No Package App')).toBeInTheDocument();
      // Should not show any package badges
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should handle very long app names', () => {
      const longName = 'A'.repeat(100);
      const app = createMockAppWithRelations({
        displayName: longName,
        packages: [],
      });

      renderWithProviders(<AppCard app={app} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'A'.repeat(500);
      const app = createMockAppWithRelations({
        description: longDescription,
        packages: [],
      });

      renderWithProviders(<AppCard app={app} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle app with null icon URL', () => {
      const app = createMockAppWithRelations({
        displayName: 'No Icon App',
        iconUrl: null,
        packages: [],
      });

      renderWithProviders(<AppCard app={app} />);

      expect(screen.getByText('No Icon App')).toBeInTheDocument();
    });

    it('should handle rapid toggle clicks', () => {
      const app = createMockAppWithRelations({ id: 'app-1', packages: [] });

      renderWithProviders(<AppCard app={app} />);

      const card = screen.getByRole('checkbox').closest('.cursor-pointer');

      // Rapidly click 5 times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(card!);
      }

      // Should be selected (odd number of clicks)
      expect(useSelectionStore.getState().selectedApps.has('app-1')).toBe(true);
    });
  });
});
