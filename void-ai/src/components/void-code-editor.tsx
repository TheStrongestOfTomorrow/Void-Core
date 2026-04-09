'use client';

import { useState, useRef } from 'react';
import { Play, Trash2, Copy, Check, ChevronDown, Zap } from 'lucide-react';

interface VoidCodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  output: string;
  isRunning: boolean;
  onRun: (code: string) => void;
  onClearOutput: () => void;
  examples: Array<{ name: string; code: string }>;
}

export default function VoidCodeEditor({
  code,
  onCodeChange,
  output,
  isRunning,
  onRun,
  onClearOutput,
  examples,
}: VoidCodeEditorProps) {
  const [showExamples, setShowExamples] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');

  const handleRun = () => {
    if (code.trim() && !isRunning) {
      onRun(code);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to run
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleRun();
    }
    // Tab to insert spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onCodeChange(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleCopyOutput = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const loadExample = (example: string) => {
    onCodeChange(example);
    setShowExamples(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--void-border)] bg-[rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[var(--void-red)] opacity-80" />
            <div className="w-3 h-3 rounded-full bg-[var(--void-orange)] opacity-80" />
            <div className="w-3 h-3 rounded-full bg-[var(--void-green)] opacity-80" />
          </div>
          <span className="text-xs text-[var(--void-orange)] font-mono ml-2">
            void-code.playground
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Examples dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--void-text-muted)] hover:text-[var(--void-orange)] hover:bg-[rgba(245,158,11,0.1)] transition-colors"
            >
              <Zap className="w-3 h-3" />
              Examples
              <ChevronDown className="w-3 h-3" />
            </button>
            {showExamples && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--void-bg-tertiary)] border border-[var(--void-border)] rounded-lg shadow-xl z-10 overflow-hidden">
                {examples.map((ex) => (
                  <button
                    key={ex.name}
                    onClick={() => loadExample(ex.code)}
                    className="w-full text-left px-3 py-2 text-xs text-[var(--void-text-muted)] hover:text-[var(--void-orange)] hover:bg-[rgba(245,158,11,0.05)] transition-colors border-b border-[var(--void-border)] last:border-0"
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-[var(--void-orange)] text-[var(--void-bg)] hover:opacity-90 transition-all disabled:opacity-40"
          >
            <Play className="w-3 h-3" />
            Run
          </button>
        </div>
      </div>

      {/* Editor + Output split view */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Code editor */}
        <div className="flex-1 flex flex-col min-h-[200px] lg:min-h-0">
          <div className="flex items-center px-3 py-1.5 border-b border-[var(--void-border)] bg-[rgba(0,0,0,0.2)]">
            <span className="text-[10px] text-[var(--void-text-muted)] font-mono uppercase tracking-wider">
              Editor
            </span>
            <span className="text-[10px] text-[var(--void-text-muted)] font-mono ml-auto">
              {lines.length} lines
            </span>
          </div>
          <div className="flex-1 overflow-auto flex">
            {/* Line numbers */}
            <div className="py-3 px-2 text-right select-none border-r border-[var(--void-border)] bg-[rgba(0,0,0,0.2)]">
              {lines.map((_, i) => (
                <div key={i} className="text-[11px] leading-5 text-[var(--void-text-muted)] font-mono">
                  {i + 1}
                </div>
              ))}
            </div>
            {/* Code textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-[rgba(0,0,0,0.3)] p-3 font-mono text-sm text-[var(--void-orange)] resize-none outline-none leading-5"
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                tabSize: 2,
              }}
              spellCheck={false}
              placeholder="// Write Void Code here..."
            />
          </div>
        </div>

        {/* Resize handle */}
        <div className="hidden lg:block w-px bg-[var(--void-border)] cursor-col-resize" />

        {/* Output panel */}
        <div className="flex-1 flex flex-col min-h-[150px] lg:min-h-0">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--void-border)] bg-[rgba(0,0,0,0.2)]">
            <span className="text-[10px] text-[var(--void-text-muted)] font-mono uppercase tracking-wider">
              Output
            </span>
            <div className="flex items-center gap-1">
              {output && (
                <button
                  onClick={handleCopyOutput}
                  className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] text-[var(--void-text-muted)] hover:text-[var(--void-text)] transition-colors"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-[var(--void-green)]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
              <button
                onClick={onClearOutput}
                className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] text-[var(--void-text-muted)] hover:text-[var(--void-red)] transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div
            ref={outputRef}
            className="flex-1 overflow-auto p-3 font-mono text-sm"
          >
            {isRunning ? (
              <div className="flex items-center gap-2 text-[var(--void-orange)]">
                <div className="animate-spin-slow w-4 h-4 border-2 border-[var(--void-orange)] border-t-transparent rounded-full" />
                <span className="text-xs">Executing...</span>
              </div>
            ) : output ? (
              <pre className="text-[var(--void-green)] whitespace-pre-wrap text-xs leading-5">{output}</pre>
            ) : (
              <p className="text-[var(--void-text-muted)] text-xs">
                Output will appear here. Press Run or Ctrl+Enter to execute.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--void-border)] bg-[rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3 text-[10px] text-[var(--void-text-muted)] font-mono">
          <span>Void Code v1.0</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[var(--void-text-muted)] font-mono">
          <span className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRunning ? 'bg-[var(--void-orange)] animate-pulse' : 'bg-[var(--void-green)]'
              }`}
            />
            {isRunning ? 'Running' : 'Ready'}
          </span>
        </div>
      </div>
    </div>
  );
}
