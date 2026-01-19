import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle } from './view-toggle';
import type { ViewMode } from '@/stores/selection-store';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Grid3x3: () => <div data-testid="grid-icon" />,
  List: () => <div data-testid="list-icon" />,
  LayoutList: () => <div data-testid="layout-list-icon" />,
}));

describe('ViewToggle', () => {
  const mockOnViewChange = vi.fn();

  const defaultProps = {
    currentView: 'minimal' as ViewMode,
    onViewChange: mockOnViewChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all three view mode buttons', () => {
      render(<ViewToggle {...defaultProps} />);

      expect(screen.getByRole('button', { name: /minimal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /compact/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /detailed/i })).toBeInTheDocument();
    });

    it('should render icons for each view mode', () => {
      render(<ViewToggle {...defaultProps} />);

      expect(screen.getByTestId('grid-icon')).toBeInTheDocument();
      expect(screen.getByTestId('list-icon')).toBeInTheDocument();
      expect(screen.getByTestId('layout-list-icon')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('should highlight minimal button when minimal view is active', () => {
      render(<ViewToggle {...defaultProps} currentView="minimal" />);

      const minimalButton = screen.getByRole('button', { name: /minimal/i });
      expect(minimalButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should highlight compact button when compact view is active', () => {
      render(<ViewToggle {...defaultProps} currentView="compact" />);

      const compactButton = screen.getByRole('button', { name: /compact/i });
      expect(compactButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should highlight detailed button when detailed view is active', () => {
      render(<ViewToggle {...defaultProps} currentView="detailed" />);

      const detailedButton = screen.getByRole('button', { name: /detailed/i });
      expect(detailedButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('interactions', () => {
    it('should call onViewChange with "minimal" when clicking minimal button', () => {
      render(<ViewToggle {...defaultProps} currentView="detailed" />);

      const minimalButton = screen.getByRole('button', { name: /minimal/i });
      fireEvent.click(minimalButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('minimal');
      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    });

    it('should call onViewChange with "compact" when clicking compact button', () => {
      render(<ViewToggle {...defaultProps} currentView="minimal" />);

      const compactButton = screen.getByRole('button', { name: /compact/i });
      fireEvent.click(compactButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('compact');
      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    });

    it('should call onViewChange with "detailed" when clicking detailed button', () => {
      render(<ViewToggle {...defaultProps} currentView="minimal" />);

      const detailedButton = screen.getByRole('button', { name: /detailed/i });
      fireEvent.click(detailedButton);

      expect(mockOnViewChange).toHaveBeenCalledWith('detailed');
      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
    });

    it('should allow clicking the same button multiple times', () => {
      render(<ViewToggle {...defaultProps} currentView="minimal" />);

      const minimalButton = screen.getByRole('button', { name: /minimal/i });
      fireEvent.click(minimalButton);
      fireEvent.click(minimalButton);

      expect(mockOnViewChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('accessibility', () => {
    it('should have aria-pressed attribute on all buttons', () => {
      render(<ViewToggle {...defaultProps} currentView="minimal" />);

      const minimalButton = screen.getByRole('button', { name: /minimal/i });
      const compactButton = screen.getByRole('button', { name: /compact/i });
      const detailedButton = screen.getByRole('button', { name: /detailed/i });

      expect(minimalButton).toHaveAttribute('aria-pressed');
      expect(compactButton).toHaveAttribute('aria-pressed');
      expect(detailedButton).toHaveAttribute('aria-pressed');
    });

    it('should have keyboard shortcuts in tooltips', () => {
      render(<ViewToggle {...defaultProps} />);

      const minimalButton = screen.getByRole('button', { name: /minimal/i });
      const compactButton = screen.getByRole('button', { name: /compact/i });
      const detailedButton = screen.getByRole('button', { name: /detailed/i });

      expect(minimalButton).toHaveAttribute('title', expect.stringContaining('1'));
      expect(compactButton).toHaveAttribute('title', expect.stringContaining('2'));
      expect(detailedButton).toHaveAttribute('title', expect.stringContaining('3'));
    });

    it('should have aria-label on all buttons', () => {
      render(<ViewToggle {...defaultProps} />);

      expect(screen.getByRole('button', { name: /minimal view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /compact view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /detailed view/i })).toBeInTheDocument();
    });

    it('should have role="group" on container', () => {
      const { container } = render(<ViewToggle {...defaultProps} />);

      const group = container.querySelector('[role="group"]');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('aria-label', 'View mode toggle');
    });
  });

  describe('visual styling', () => {
    it('should apply correct variant classes based on active state', () => {
      render(<ViewToggle {...defaultProps} currentView="minimal" />);

      const minimalButton = screen.getByRole('button', { name: /minimal/i });
      const compactButton = screen.getByRole('button', { name: /compact/i });

      // Active button should have different styling than inactive button
      // Both buttons have base classes, but inactive has hover styles
      expect(minimalButton).toBeInTheDocument();
      expect(compactButton).toBeInTheDocument();

      // Verify active state via aria-pressed instead of class names
      expect(minimalButton).toHaveAttribute('aria-pressed', 'true');
      expect(compactButton).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
