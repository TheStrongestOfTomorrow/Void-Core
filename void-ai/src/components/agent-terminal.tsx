'use client';

import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { type TerminalLine } from '@/hooks/use-agent';

interface AgentTerminalProps {
  terminalHistory: TerminalLine[];
  workingDir: string;
  onCommand: (command: string) => void;
  onClear: () => void;
}

export default function AgentTerminal({ terminalHistory, workingDir, onCommand, onClear }: AgentTerminalProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      if (cmd) {
        onCommand(cmd);
        setInput('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--void-border)] bg-[rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[var(--void-red)] opacity-80" />
            <div className="w-3 h-3 rounded-full bg-[var(--void-orange)] opacity-80" />
            <div className="w-3 h-3 rounded-full bg-[var(--void-green)] opacity-80" />
          </div>
          <span className="text-xs text-[var(--void-text-muted)] font-mono ml-2">
            void-agent — {workingDir}
          </span>
        </div>
        <button
          onClick={onClear}
          className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] text-[var(--void-text-muted)] hover:text-[var(--void-red)] transition-colors"
          title="Clear terminal"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terminal output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {/* Welcome message */}
        {terminalHistory.length === 0 && (
          <div className="space-y-2">
            <p className="text-[var(--void-green)]">
              Void Agent Terminal v1.0
            </p>
            <p className="text-[var(--void-text-muted)] text-xs">
              Type commands below. Safety restrictions apply.
            </p>
            <p className="text-[var(--void-text-muted)] text-xs">
              Use the input below to execute commands.
            </p>
          </div>
        )}

        {/* Terminal lines */}
        {terminalHistory.map((line, idx) => (
          <div key={idx} className="mb-1">
            {line.type === 'input' ? (
              <div className="flex gap-2">
                <span className="text-[var(--void-green)] flex-shrink-0">void@agent:~$</span>
                <span className="text-[var(--void-text)]">{line.content}</span>
              </div>
            ) : line.type === 'error' ? (
              <div className="text-[var(--void-red)] whitespace-pre-wrap">{line.content}</div>
            ) : line.type === 'info' ? (
              <div className="text-[var(--void-text-muted)] whitespace-pre-wrap">{line.content}</div>
            ) : (
              <div className="text-[var(--void-text)] whitespace-pre-wrap">{line.content}</div>
            )}
          </div>
        ))}
      </div>

      {/* Terminal input */}
      <div className="border-t border-[var(--void-border)] bg-[rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 px-4 py-3">
          <Terminal className="w-4 h-4 text-[var(--void-green)] flex-shrink-0" />
          <span className="text-[var(--void-green)] font-mono text-sm flex-shrink-0">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-sm font-mono text-[var(--void-text)] outline-none placeholder:text-[var(--void-text-muted)]"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
