import {
  Globe,
  Code,
  Play,
  Image,
  FileText,
  Wrench,
  MessageCircle,
  Gamepad2,
  Shield,
  Settings,
  LayoutGrid,
  type LucideIcon, Terminal, Command,
} from 'lucide-react';

/**
 * Map of icon names to Lucide icon components
 */
const iconMap: Record<string, LucideIcon> = {
  Globe,
  Code,
  Play,
  Image,
  FileText,
  Wrench,
  MessageCircle,
  Gamepad2,
  Shield,
  Settings,
  LayoutGrid,
  Terminal,
  Command
};

/**
 * Get the Lucide icon component for a given icon name
 */
export function getCategoryIcon(iconName: string | null): LucideIcon {
  if (!iconName) return LayoutGrid;
  return iconMap[iconName] || LayoutGrid;
}
