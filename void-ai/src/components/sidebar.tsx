'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Search,
  Terminal,
  Zap,
  Plus,
  Download,
  Trash2,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { type Mode, type Conversation } from '@/hooks/use-chat';
import { MODE_CONFIG } from './mode-indicator';
import ModeIndicator from './mode-indicator';

interface SidebarProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSwitchConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onExport: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const MODE_ITEMS: Array<{ mode: Mode; icon: React.ReactNode; label: string }> = [
  { mode: 'chat', icon: <MessageSquare className="w-4 h-4" />, label: 'Chat' },
  { mode: 'deepthink', icon: <Search className="w-4 h-4" />, label: 'DeepThink' },
  { mode: 'agent', icon: <Terminal className="w-4 h-4" />, label: 'Agent' },
  { mode: 'voidcode', icon: <Zap className="w-4 h-4" />, label: 'Void Code' },
];

export default function Sidebar({
  currentMode,
  onModeChange,
  conversations,
  currentConversationId,
  onSwitchConversation,
  onNewConversation,
  onDeleteConversation,
  onExport,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col bg-[var(--void-bg-secondary)] border-r border-[var(--void-border)] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--void-border)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-[var(--void-cyan)] text-glow-cyan">
                VOID AI
              </h1>
              <p className="text-[9px] text-[var(--void-text-muted)] font-mono tracking-widest">
                ASSEMBLY OF AI
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[var(--void-text-muted)] hover:text-[var(--void-text)] transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-3 space-y-1">
          <p className="text-[10px] text-[var(--void-text-muted)] font-semibold uppercase tracking-wider px-2 mb-2">
            Modes
          </p>
          {MODE_ITEMS.map(({ mode, icon, label }) => {
            const config = MODE_CONFIG[mode];
            const isActive = currentMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'font-medium'
                    : 'text-[var(--void-text-muted)] hover:text-[var(--void-text)] hover:bg-[rgba(255,255,255,0.03)]'
                }`}
                style={{
                  backgroundColor: isActive ? config.bgColor : undefined,
                  color: isActive ? config.color : undefined,
                  borderLeft: isActive ? `2px solid ${config.color}` : '2px solid transparent',
                }}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] text-[var(--void-text-muted)] font-semibold uppercase tracking-wider">
              Conversations
            </p>
            <button
              onClick={onNewConversation}
              className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] text-[var(--void-text-muted)] hover:text-[var(--void-cyan)] transition-colors"
              title="New conversation"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {conversations.length === 0 ? (
            <p className="text-xs text-[var(--void-text-muted)] px-2 py-4 text-center">
              No conversations yet
            </p>
          ) : (
            conversations.map((convo) => {
              const modeConfig = MODE_CONFIG[convo.mode];
              const isActive = convo.id === currentConversationId;
              return (
                <div
                  key={convo.id}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-[rgba(255,255,255,0.05)]'
                      : 'hover:bg-[rgba(255,255,255,0.03)]'
                  }`}
                  onClick={() => onSwitchConversation(convo.id)}
                  onMouseEnter={() => setHoveredId(convo.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: modeConfig.color }}
                  />
                  <span className={`text-xs truncate flex-1 ${isActive ? 'text-[var(--void-text)]' : 'text-[var(--void-text-muted)]'}`}>
                    {convo.title}
                  </span>
                  {hoveredId === convo.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(convo.id);
                      }}
                      className="p-0.5 rounded hover:bg-[rgba(239,68,68,0.1)] text-[var(--void-text-muted)] hover:text-[var(--void-red)] transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[var(--void-border)] space-y-1">
          <button
            onClick={onExport}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--void-text-muted)] hover:text-[var(--void-text)] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .void file</span>
          </button>
        </div>
      </aside>

      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-3 left-3 z-40 p-2 rounded-lg glass glass-hover text-[var(--void-text-muted)] hover:text-[var(--void-text)] transition-colors lg:hidden"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </>
  );
}
