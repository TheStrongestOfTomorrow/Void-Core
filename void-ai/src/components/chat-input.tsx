'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Code, Zap, Terminal, Search, ChevronDown } from 'lucide-react';
import { type Mode } from '@/hooks/use-chat';
import { type DepthLevel } from '@/hooks/use-deep-think';
import { MODE_CONFIG } from './mode-indicator';

interface ChatInputProps {
  mode: Mode;
  onSend: (content: string) => void;
  loading: boolean;
  depth?: DepthLevel;
  onDepthChange?: (depth: DepthLevel) => void;
  workingDir?: string;
  code?: string;
  onCodeChange?: (code: string) => void;
  isCodeEditor?: boolean;
}

export default function ChatInput({
  mode,
  onSend,
  loading,
  depth = 'quick',
  onDepthChange,
  workingDir,
  code,
  onCodeChange,
  isCodeEditor,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const config = MODE_CONFIG[mode];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input, isCodeEditor ? code : input]);

  const handleSend = () => {
    const content = isCodeEditor ? (code || '') : input.trim();
    if (!content || loading) return;
    onSend(content);
    if (!isCodeEditor) setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isCodeEditor) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCodeKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to run in code editor
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && isCodeEditor) {
      e.preventDefault();
      handleSend();
    }
    // Tab to insert spaces
    if (e.key === 'Tab' && isCodeEditor) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = (code || '').substring(0, start) + '  ' + (code || '').substring(end);
      onCodeChange?.(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="border-t border-[var(--void-border)] p-3 sm:p-4">
      {/* Mode-specific controls */}
      <div className="max-w-3xl mx-auto">
        {/* Agent mode: working directory */}
        {mode === 'agent' && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <Terminal className="w-3.5 h-3.5 text-[var(--void-green)]" />
            <span className="text-xs font-mono text-[var(--void-text-muted)]">
              void@agent:~$
            </span>
            <span className="text-xs font-mono text-[var(--void-green)]">{workingDir || '/tmp'}</span>
          </div>
        )}

        {/* DeepThink: depth selector */}
        {mode === 'deepthink' && onDepthChange && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <Search className="w-3.5 h-3.5 text-[var(--void-purple)]" />
            <span className="text-xs text-[var(--void-text-muted)]">Research Depth:</span>
            <div className="flex gap-1">
              {(['quick', 'deep', 'exhaustive'] as DepthLevel[]).map((d) => (
                <button
                  key={d}
                  onClick={() => onDepthChange(d)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                    depth === d
                      ? 'bg-[rgba(139,92,246,0.2)] text-[var(--void-purple)] border border-[rgba(139,92,246,0.4)]'
                      : 'text-[var(--void-text-muted)] hover:text-[var(--void-text)]'
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Void Code: editor hints */}
        {mode === 'voidcode' && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <Zap className="w-3.5 h-3.5 text-[var(--void-orange)]" />
            <span className="text-xs text-[var(--void-text-muted)]">
              Ctrl+Enter to run • Use ← for assignment, → for print
            </span>
          </div>
        )}

        {/* Input area */}
        <div
          className="flex items-end gap-2 rounded-xl border transition-all duration-200"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: loading ? `${config.color}40` : 'var(--void-border)',
            boxShadow: loading ? `0 0 20px ${config.color}10` : 'none',
          }}
        >
          {mode === 'voidcode' ? (
            <textarea
              ref={textareaRef}
              value={code || ''}
              onChange={(e) => onCodeChange?.(e.target.value)}
              onKeyDown={handleCodeKeyDown}
              placeholder="// Write Void Code here..."
              className={`flex-1 bg-transparent text-sm p-3 resize-none outline-none placeholder:text-[var(--void-text-muted)] ${
                isCodeEditor ? 'min-h-[120px] font-mono text-[var(--void-orange)]' : 'min-h-[44px]'
              }`}
              style={{
                fontFamily: isCodeEditor ? "'JetBrains Mono', 'Fira Code', monospace" : undefined,
              }}
              disabled={loading}
              spellCheck={false}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'agent'
                  ? 'Enter a shell command...'
                  : mode === 'deepthink'
                  ? 'What would you like to research?'
                  : 'Message Void AI...'
              }
              className={`flex-1 bg-transparent text-sm p-3 min-h-[44px] max-h-[200px] resize-none outline-none placeholder:text-[var(--void-text-muted)] ${
                mode === 'agent' ? 'font-mono' : ''
              }`}
              disabled={loading}
            />
          )}

          <button
            onClick={handleSend}
            disabled={
              loading ||
              (!isCodeEditor && !input.trim()) ||
              (isCodeEditor && !code?.trim())
            }
            className="p-2.5 mr-1.5 rounded-lg transition-all duration-200 flex-shrink-0"
            style={{
              backgroundColor: loading ? `${config.color}20` : `${config.color}`,
              color: loading ? config.color : 'var(--void-bg)',
            }}
          >
            {mode === 'voidcode' ? (
              <Code className="w-4 h-4" />
            ) : mode === 'agent' ? (
              <Terminal className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Bottom hint */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-[var(--void-text-muted)]">
            {mode === 'chat' && 'Void AI can make mistakes. Verify important information.'}
            {mode === 'deepthink' && 'Results are sourced from web search and may not always be up to date.'}
            {mode === 'agent' && 'Commands run in a sandboxed environment with safety restrictions.'}
            {mode === 'voidcode' && 'Void Code: Mathematical expression language. ← assign, → print.'}
          </span>
        </div>
      </div>
    </div>
  );
}
