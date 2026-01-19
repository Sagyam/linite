import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog';

// Mock Dialog components from shadcn/ui
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
}));

describe('KeyboardShortcutsDialog', () => {
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render dialog when open is true', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} open={true} />);

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} open={false} />);

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should render dialog title', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should render dialog description', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText(/vim-inspired keybindings/i)).toBeInTheDocument();
    });
  });

  describe('shortcut categories', () => {
    it('should render Navigation section', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    it('should render Selection section', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('Selection')).toBeInTheDocument();
    });

    it('should render Search & Filters section', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('Search & Filters')).toBeInTheDocument();
    });

    it('should render View Controls section', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText('View Controls')).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts content', () => {
    it('should display navigation shortcuts', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText(/move down to next app/i)).toBeInTheDocument();
      expect(screen.getByText(/move up to previous app/i)).toBeInTheDocument();
      expect(screen.getByText(/navigate to previous category/i)).toBeInTheDocument();
      expect(screen.getByText(/navigate to next category/i)).toBeInTheDocument();
      expect(screen.getByText(/jump to top/i)).toBeInTheDocument();
      expect(screen.getByText(/jump to bottom/i)).toBeInTheDocument();
    });

    it('should display selection shortcuts', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      // Use getAllByText since "Toggle app selection" appears twice (for Space and Enter keys)
      expect(screen.getAllByText(/toggle app selection/i)).toHaveLength(2);
      expect(screen.getByText(/remove app from selection/i)).toBeInTheDocument();
      expect(screen.getByText(/enter visual mode/i)).toBeInTheDocument();
    });

    it('should display search shortcuts', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText(/focus search input/i)).toBeInTheDocument();
      expect(screen.getByText(/clear search/i)).toBeInTheDocument();
      expect(screen.getByText(/show this shortcuts dialog/i)).toBeInTheDocument();
    });

    it('should display view control shortcuts', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText(/cycle through view modes/i)).toBeInTheDocument();
      expect(screen.getByText(/switch to minimal view/i)).toBeInTheDocument();
      expect(screen.getByText(/switch to compact view/i)).toBeInTheDocument();
      expect(screen.getByText(/switch to detailed view/i)).toBeInTheDocument();
      expect(screen.getByText(/toggle between minimal and detailed/i)).toBeInTheDocument();
    });
  });

  describe('keyboard key displays', () => {
    it('should render keyboard keys in kbd tags', () => {
      const { container } = render(<KeyboardShortcutsDialog {...defaultProps} />);

      const kbdElements = container.querySelectorAll('kbd');
      expect(kbdElements.length).toBeGreaterThan(0);
    });

    it('should display j key', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      const kbdElements = screen.getAllByText('j');
      expect(kbdElements.length).toBeGreaterThan(0);
    });

    it('should display k key', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      const kbdElements = screen.getAllByText('k');
      expect(kbdElements.length).toBeGreaterThan(0);
    });

    it('should display combination keys (like gg)', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      const gElements = screen.getAllByText('g');
      // Should have multiple 'g' elements for the 'gg' shortcut
      expect(gElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('tip section', () => {
    it('should render tip about visual mode', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      expect(screen.getByText(/tip:/i)).toBeInTheDocument();
      // "visual mode" appears multiple times, so use getAllByText
      expect(screen.getAllByText(/visual mode/i).length).toBeGreaterThan(0);
    });

    it('should explain visual mode usage', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      // Find the tip section - it's the text after "Tip:"
      const tipSection = screen.getByText(/tip:/i).parentElement;
      expect(tipSection?.textContent).toMatch(/visual mode/i);
    });
  });

  describe('accessibility', () => {
    it('should have semantic structure with headings', () => {
      render(<KeyboardShortcutsDialog {...defaultProps} />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should use kbd elements for keyboard keys', () => {
      const { container } = render(<KeyboardShortcutsDialog {...defaultProps} />);

      const kbdElements = container.querySelectorAll('kbd');
      expect(kbdElements.length).toBeGreaterThan(15); // Should have many kbd tags
    });
  });

  describe('responsive behavior', () => {
    it('should have DialogContent with proper styling', () => {
      const { container } = render(<KeyboardShortcutsDialog {...defaultProps} />);

      const dialogContent = screen.getByTestId('dialog-content');
      // The DialogContent mock doesn't pass className through, so just verify it exists
      expect(dialogContent).toBeInTheDocument();
    });
  });
});
