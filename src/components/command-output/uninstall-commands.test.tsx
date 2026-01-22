import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/component-utils';
import { UninstallCommands } from './uninstall-commands';

describe('UninstallCommands', () => {
  const mockOnCopyCommand = vi.fn();

  const defaultProps = {
    commands: [],
    breakdown: [],
    copiedItems: {},
    onCopyCommand: mockOnCopyCommand,
  };

  it('should render nothing when commands and breakdown are empty', () => {
    const { container } = renderWithProviders(<UninstallCommands {...defaultProps} />);

    expect(container.querySelector('.space-y-3')?.children).toHaveLength(0);
  });

  it('should render single source with single package correctly', () => {
    const props = {
      ...defaultProps,
      commands: ['sudo apt remove -y firefox'],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
      ],
    };

    renderWithProviders(<UninstallCommands {...props} />);

    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('1 package')).toBeInTheDocument();
    expect(screen.getByText('sudo apt remove -y firefox')).toBeInTheDocument();
  });

  it('should render single source with multiple packages correctly', () => {
    const props = {
      ...defaultProps,
      commands: ['sudo apt remove -y firefox chrome'],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'APT', packages: ['chrome'] },
      ],
    };

    renderWithProviders(<UninstallCommands {...props} />);

    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('2 packages')).toBeInTheDocument();
    expect(screen.getByText('sudo apt remove -y firefox chrome')).toBeInTheDocument();
  });

  it('should render multiple sources correctly', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt remove -y firefox',
        'flatpak uninstall -y com.google.Chrome',
        'brew uninstall deno',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'Flatpak', packages: ['com.google.Chrome'] },
        { source: 'Homebrew', packages: ['deno'] },
      ],
    };

    renderWithProviders(<UninstallCommands {...props} />);

    // Check all three sources are displayed
    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('Flatpak')).toBeInTheDocument();
    expect(screen.getByText('Homebrew')).toBeInTheDocument();

    // Check all three commands are displayed
    expect(screen.getByText('sudo apt remove -y firefox')).toBeInTheDocument();
    expect(screen.getByText('flatpak uninstall -y com.google.Chrome')).toBeInTheDocument();
    expect(screen.getByText('brew uninstall deno')).toBeInTheDocument();
  });

  it('should filter out empty commands (regression test for empty blocks bug)', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt remove -y firefox',
        '', // Empty command
        'flatpak uninstall -y com.google.Chrome',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'Empty', packages: ['test'] },
        { source: 'Flatpak', packages: ['com.google.Chrome'] },
      ],
    };

    renderWithProviders(<UninstallCommands {...props} />);

    // Should only show 2 command blocks, not 3
    const commandBlocks = screen.getAllByRole('button', { name: /Copy|Copied/ });
    expect(commandBlocks).toHaveLength(2);

    // Empty source should not be displayed
    expect(screen.queryByText('Empty')).not.toBeInTheDocument();

    // Valid sources should be displayed
    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('Flatpak')).toBeInTheDocument();
  });

  it('should handle breakdown/commands index mismatch (regression test)', () => {
    // This simulates the bug: 10 breakdown entries but only 1 command
    const props = {
      ...defaultProps,
      commands: ['sudo apt remove -y firefox chrome deluge filezilla audacity'],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'APT', packages: ['chrome'] },
        { source: 'APT', packages: ['deluge'] },
        { source: 'APT', packages: ['filezilla'] },
        { source: 'APT', packages: ['audacity'] },
      ],
    };

    renderWithProviders(<UninstallCommands {...props} />);

    // Should show exactly 1 command block with 5 packages
    const commandBlocks = screen.getAllByRole('button', { name: /Copy|Copied/ });
    expect(commandBlocks).toHaveLength(1);

    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('5 packages')).toBeInTheDocument();
    expect(screen.getByText('sudo apt remove -y firefox chrome deluge filezilla audacity')).toBeInTheDocument();
  });

  it('should handle mixed sources with multiple packages each (complex scenario)', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt remove -y firefox chrome',
        'flatpak uninstall -y com.google.AndroidStudio com.discordapp.Discord',
        'brew uninstall deno',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'APT', packages: ['chrome'] },
        { source: 'Flatpak', packages: ['com.google.AndroidStudio'] },
        { source: 'Flatpak', packages: ['com.discordapp.Discord'] },
        { source: 'Homebrew', packages: ['deno'] },
      ],
    };

    renderWithProviders(<UninstallCommands {...props} />);

    // Should show 3 command blocks
    const commandBlocks = screen.getAllByRole('button', { name: /Copy|Copied/ });
    expect(commandBlocks).toHaveLength(3);

    // APT with 2 packages
    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('2 packages')).toBeInTheDocument();

    // Flatpak with 2 packages
    expect(screen.getByText('Flatpak')).toBeInTheDocument();

    // Homebrew with 1 package
    expect(screen.getByText('Homebrew')).toBeInTheDocument();
    expect(screen.getByText('1 package')).toBeInTheDocument();
  });

  it('should call onCopyCommand with correct index when copy button is clicked', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt remove -y firefox',
        'flatpak uninstall -y com.google.Chrome',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'Flatpak', packages: ['com.google.Chrome'] },
      ],
    };

    renderWithProviders(<UninstallCommands {...props} />);

    const copyButtons = screen.getAllByRole('button', { name: /Copy/ });

    // Click first copy button
    fireEvent.click(copyButtons[0]);
    expect(mockOnCopyCommand).toHaveBeenCalledWith(0);

    // Click second copy button
    fireEvent.click(copyButtons[1]);
    expect(mockOnCopyCommand).toHaveBeenCalledWith(1);
  });

  it('should show "Copied" when copiedItems indicates a command was copied', () => {
    const props = {
      ...defaultProps,
      commands: ['sudo apt remove -y firefox'],
      breakdown: [{ source: 'APT', packages: ['firefox'] }],
      copiedItems: { 0: true },
    };

    renderWithProviders(<UninstallCommands {...props} />);

    expect(screen.getByText('Copied')).toBeInTheDocument();
    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
  });

  it('should handle whitespace-only commands as empty', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt remove -y firefox',
        '   ', // Whitespace only
        'flatpak uninstall -y com.google.Chrome',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'Whitespace', packages: ['test'] },
        { source: 'Flatpak', packages: ['com.google.Chrome'] },
      ],
    };

    renderWithProviders(<UninstallCommands {...props} />);

    // Should only show 2 command blocks, not 3
    const commandBlocks = screen.getAllByRole('button', { name: /Copy|Copied/ });
    expect(commandBlocks).toHaveLength(2);

    // Whitespace source should not be displayed
    expect(screen.queryByText('Whitespace')).not.toBeInTheDocument();
  });

  it('should handle undefined commands gracefully', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt remove -y firefox',
        undefined as any, // Simulating missing command
        'flatpak uninstall -y com.google.Chrome',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'Undefined', packages: ['test'] },
        { source: 'Flatpak', packages: ['com.google.Chrome'] },
      ],
    };

    renderWithProviders(<UninstallCommands {...props} />);

    // Should only show 2 command blocks
    const commandBlocks = screen.getAllByRole('button', { name: /Copy|Copied/ });
    expect(commandBlocks).toHaveLength(2);

    expect(screen.queryByText('Undefined')).not.toBeInTheDocument();
  });

  it('should handle case where no valid commands exist', () => {
    const props = {
      ...defaultProps,
      commands: ['', '  ', undefined as any],
      breakdown: [
        { source: 'Empty1', packages: ['test'] },
        { source: 'Empty2', packages: ['test'] },
        { source: 'Empty3', packages: ['test'] },
      ],
    };

    const { container } = renderWithProviders(<UninstallCommands {...props} />);

    // Should render no command blocks
    expect(container.querySelector('.space-y-3')?.children).toHaveLength(0);
  });

  it('should correctly handle Script source (single command per package)', () => {
    const props = {
      ...defaultProps,
      commands: [
        'curl -fsSL https://example.com/uninstall.sh | bash',
        'curl -fsSL https://example.com/uninstall2.sh | bash',
      ],
      breakdown: [
        { source: 'Script', packages: ['package1'] },
        { source: 'Script', packages: ['package2'] },
      ],
    };

    renderWithProviders(<UninstallCommands {...props} />);

    // Should show 2 separate script commands
    const commandBlocks = screen.getAllByRole('button', { name: /Copy|Copied/ });
    expect(commandBlocks).toHaveLength(2);

    expect(screen.getByText('curl -fsSL https://example.com/uninstall.sh | bash')).toBeInTheDocument();
    expect(screen.getByText('curl -fsSL https://example.com/uninstall2.sh | bash')).toBeInTheDocument();
  });
});
