import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/component-utils';
import { InstallCommands } from './install-commands';

describe('InstallCommands', () => {
  const mockOnCopyCommand = vi.fn();

  const defaultProps = {
    commands: [],
    breakdown: [],
    copiedItems: {},
    onCopyCommand: mockOnCopyCommand,
  };

  it('should render nothing when commands and breakdown are empty', () => {
    const { container } = renderWithProviders(<InstallCommands {...defaultProps} />);

    expect(container.querySelector('.space-y-3')?.children).toHaveLength(0);
  });

  it('should render single source with single package correctly', () => {
    const props = {
      ...defaultProps,
      commands: ['sudo apt install firefox'],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
      ],
    };

    renderWithProviders(<InstallCommands {...props} />);

    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('1 package')).toBeInTheDocument();
    expect(screen.getByText('sudo apt install firefox')).toBeInTheDocument();
  });

  it('should render single source with multiple packages correctly', () => {
    const props = {
      ...defaultProps,
      commands: ['sudo apt install firefox chrome'],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'APT', packages: ['chrome'] },
      ],
    };

    renderWithProviders(<InstallCommands {...props} />);

    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('2 packages')).toBeInTheDocument();
    expect(screen.getByText('sudo apt install firefox chrome')).toBeInTheDocument();
  });

  it('should render multiple sources correctly', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt install firefox',
        'flatpak install flathub com.google.Chrome',
        'brew install deno',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'Flatpak', packages: ['com.google.Chrome'] },
        { source: 'Homebrew', packages: ['deno'] },
      ],
    };

    renderWithProviders(<InstallCommands {...props} />);

    // Check all three sources are displayed
    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('Flatpak')).toBeInTheDocument();
    expect(screen.getByText('Homebrew')).toBeInTheDocument();

    // Check all three commands are displayed
    expect(screen.getByText('sudo apt install firefox')).toBeInTheDocument();
    expect(screen.getByText('flatpak install flathub com.google.Chrome')).toBeInTheDocument();
    expect(screen.getByText('brew install deno')).toBeInTheDocument();
  });

  it('should filter out empty commands (regression test for empty blocks bug)', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt install firefox',
        '', // Empty command
        'flatpak install flathub com.google.Chrome',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'Empty', packages: ['test'] },
        { source: 'Flatpak', packages: ['com.google.Chrome'] },
      ],
    };

    renderWithProviders(<InstallCommands {...props} />);

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
      commands: ['sudo apt install firefox chrome deluge filezilla'],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'APT', packages: ['chrome'] },
        { source: 'APT', packages: ['deluge'] },
        { source: 'APT', packages: ['filezilla'] },
      ],
    };

    renderWithProviders(<InstallCommands {...props} />);

    // Should show exactly 1 command block with 4 packages
    const commandBlocks = screen.getAllByRole('button', { name: /Copy|Copied/ });
    expect(commandBlocks).toHaveLength(1);

    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('4 packages')).toBeInTheDocument();
    expect(screen.getByText('sudo apt install firefox chrome deluge filezilla')).toBeInTheDocument();
  });

  it('should handle mixed sources with multiple packages each (complex scenario)', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt install firefox chrome',
        'flatpak install flathub com.google.AndroidStudio com.discordapp.Discord',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'APT', packages: ['chrome'] },
        { source: 'Flatpak', packages: ['com.google.AndroidStudio'] },
        { source: 'Flatpak', packages: ['com.discordapp.Discord'] },
      ],
    };

    renderWithProviders(<InstallCommands {...props} />);

    // Should show 2 command blocks
    const commandBlocks = screen.getAllByRole('button', { name: /Copy|Copied/ });
    expect(commandBlocks).toHaveLength(2);

    // APT with 2 packages
    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('2 packages')).toBeInTheDocument();

    // Flatpak with 2 packages
    expect(screen.getByText('Flatpak')).toBeInTheDocument();
    // Need to use getAllByText since "2 packages" appears twice
    const packageCounts = screen.getAllByText('2 packages');
    expect(packageCounts).toHaveLength(2);
  });

  it('should call onCopyCommand with correct index when copy button is clicked', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt install firefox',
        'flatpak install flathub com.google.Chrome',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'Flatpak', packages: ['com.google.Chrome'] },
      ],
    };

    renderWithProviders(<InstallCommands {...props} />);

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
      commands: ['sudo apt install firefox'],
      breakdown: [{ source: 'APT', packages: ['firefox'] }],
      copiedItems: { 0: true },
    };

    renderWithProviders(<InstallCommands {...props} />);

    expect(screen.getByText('Copied')).toBeInTheDocument();
    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
  });

  it('should handle whitespace-only commands as empty', () => {
    const props = {
      ...defaultProps,
      commands: [
        'sudo apt install firefox',
        '   ', // Whitespace only
        'flatpak install flathub com.google.Chrome',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'Whitespace', packages: ['test'] },
        { source: 'Flatpak', packages: ['com.google.Chrome'] },
      ],
    };

    renderWithProviders(<InstallCommands {...props} />);

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
        'sudo apt install firefox',
        undefined as any, // Simulating missing command
        'flatpak install flathub com.google.Chrome',
      ],
      breakdown: [
        { source: 'APT', packages: ['firefox'] },
        { source: 'Undefined', packages: ['test'] },
        { source: 'Flatpak', packages: ['com.google.Chrome'] },
      ],
    };

    renderWithProviders(<InstallCommands {...props} />);

    // Should only show 2 command blocks
    const commandBlocks = screen.getAllByRole('button', { name: /Copy|Copied/ });
    expect(commandBlocks).toHaveLength(2);

    expect(screen.queryByText('Undefined')).not.toBeInTheDocument();
  });
});
