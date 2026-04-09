'use client';

import { PanelLeftClose, Sparkles } from 'lucide-react';
import { type Mode } from '@/hooks/use-chat';
import ModeIndicator from './mode-indicator';

interface HeaderProps {
  mode: Mode;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ mode, onToggleSidebar, sidebarOpen }: HeaderProps) {
  return (
    <header className="h-12 flex items-center justify-between px-3 sm:px-4 border-b border-[var(--void-border)] bg-[var(--void-bg-secondary)] flex-shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[var(--void-text-muted)] hover:text-[var(--void-text)] transition-colors hidden lg:flex"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[var(--void-text-muted)] hover:text-[var(--void-text)] transition-colors lg:hidden"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
        <ModeIndicator mode={mode} size="sm" />
        <div className="hidden sm:flex items-center gap-1.5 ml-2">
          <Sparkles className="w-3 h-3 text-[var(--void-cyan)] opacity-60" />
          <span className="text-xs text-[var(--void-text-muted)]">Void AI v1.0</span>
        </div>
      </div>
    </header>
  );
}
