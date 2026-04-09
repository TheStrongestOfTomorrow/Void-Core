'use client';

import { type Mode } from '@/hooks/use-chat';

const MODE_CONFIG: Record<Mode, { label: string; icon: string; color: string; bgColor: string; glowClass: string; description: string }> = {
  chat: {
    label: 'Chat',
    icon: '💬',
    color: '#00f0ff',
    bgColor: 'rgba(0, 240, 255, 0.1)',
    glowClass: 'glow-cyan',
    description: 'Standard AI conversation',
  },
  deepthink: {
    label: 'DeepThink',
    icon: '🔍',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    glowClass: 'glow-purple',
    description: 'Deep research with web search',
  },
  agent: {
    label: 'Agent',
    icon: '🖥',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    glowClass: 'glow-green',
    description: 'Execute shell commands',
  },
  voidcode: {
    label: 'Void Code',
    icon: '⚡',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    glowClass: 'glow-orange',
    description: 'Run Void Code programs',
  },
};

interface ModeIndicatorProps {
  mode: Mode;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export default function ModeIndicator({ mode, size = 'md', showLabel = true, animated = true }: ModeIndicatorProps) {
  const config = MODE_CONFIG[mode];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-medium transition-all duration-300 ${sizeClasses[size]} ${animated ? 'animate-glow-pulse' : ''}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

export { MODE_CONFIG };
export type { Mode };
