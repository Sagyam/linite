import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/component-utils';
import { BulkActionBar } from './bulk-action-bar';

describe('BulkActionBar', () => {
  const defaultProps = {
    selectedCount: 3,
    onDelete: vi.fn(),
    onClearSelection: vi.fn(),
  };

  it('should not render when selectedCount is 0', () => {
    const { container } = renderWithProviders(
      <BulkActionBar
        {...defaultProps}
        selectedCount={0}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render with correct selected count', () => {
    renderWithProviders(<BulkActionBar {...defaultProps} />);

    expect(screen.getByTestId('selected-count')).toHaveTextContent('3 installations selected');
  });

  it('should render singular "installation" for count of 1', () => {
    renderWithProviders(
      <BulkActionBar
        {...defaultProps}
        selectedCount={1}
      />
    );

    expect(screen.getByTestId('selected-count')).toHaveTextContent('1 installation selected');
  });

  it('should call onClearSelection when clear button is clicked', () => {
    const onClearSelection = vi.fn();
    renderWithProviders(
      <BulkActionBar
        {...defaultProps}
        onClearSelection={onClearSelection}
      />
    );

    const clearButton = screen.getByTestId('clear-selection-button');
    fireEvent.click(clearButton);

    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    renderWithProviders(
      <BulkActionBar
        {...defaultProps}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when isDeleting is true', () => {
    renderWithProviders(
      <BulkActionBar
        {...defaultProps}
        isDeleting={true}
      />
    );

    const clearButton = screen.getByTestId('clear-selection-button');
    const deleteButton = screen.getByTestId('delete-button');

    expect(clearButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('should show loading spinner and "Deleting..." text when isDeleting is true', () => {
    renderWithProviders(
      <BulkActionBar
        {...defaultProps}
        isDeleting={true}
      />
    );

    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).toHaveTextContent('Deleting...');
    expect(deleteButton.querySelector('.animate-spin')).toBeTruthy();
  });

  it('should show "Delete Selected" text when not deleting', () => {
    renderWithProviders(
      <BulkActionBar
        {...defaultProps}
        isDeleting={false}
      />
    );

    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).toHaveTextContent('Delete Selected');
  });

  it('should have correct CSS classes for positioning and styling', () => {
    renderWithProviders(<BulkActionBar {...defaultProps} />);

    const container = screen.getByTestId('bulk-action-bar');
    expect(container.className).toContain('fixed');
    expect(container.className).toContain('bottom-4');
    expect(container.className).toContain('z-50');
  });
});
