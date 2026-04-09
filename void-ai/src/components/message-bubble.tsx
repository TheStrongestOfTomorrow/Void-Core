'use client';

import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { type Message } from '@/hooks/use-chat';
import { MODE_CONFIG } from './mode-indicator';

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isLatest, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const config = MODE_CONFIG[message.mode];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLatest && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [message.content, isLatest]);

  if (isStreaming && !message.content) {
    return (
      <div ref={ref} className="flex gap-3 px-4 py-2 animate-float-up">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
          style={{ backgroundColor: config.bgColor }}
        >
          <span>{config.icon}</span>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm glass">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--void-cyan)] typing-dot"></span>
            <span className="w-2 h-2 rounded-full bg-[var(--void-cyan)] typing-dot"></span>
            <span className="w-2 h-2 rounded-full bg-[var(--void-cyan)] typing-dot"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`flex gap-3 px-4 py-2 animate-float-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0 mt-1"
        style={{
          backgroundColor: isUser ? 'rgba(255,255,255,0.08)' : config.bgColor,
        }}
      >
        {isUser ? '👤' : config.icon}
      </div>

      {/* Message Content */}
      <div className={`max-w-[80%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'rounded-tr-sm bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)]'
              : 'rounded-tl-sm glass'
          }`}
        >
          {/* Terminal command display for agent mode */}
          {message.mode === 'agent' && message.command && message.role === 'assistant' && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[var(--void-green)] text-xs font-mono">void@agent:~$</span>
              <code className="text-sm text-[var(--void-text)] font-mono">{message.command}</code>
              {message.exitCode !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    message.exitCode === 0
                      ? 'text-[var(--void-green)] bg-[rgba(16,185,129,0.1)]'
                      : 'text-[var(--void-red)] bg-[rgba(239,68,68,0.1)]'
                  }`}
                >
                  exit {message.exitCode}
                </span>
              )}
            </div>
          )}

          {/* Void Code mode styling */}
          {message.mode === 'voidcode' && message.role === 'assistant' && message.codeOutput ? (
            <div className="space-y-2">
              <div className="text-sm">
                <ReactMarkdown
                  components={{
                    pre: ({ children }) => <pre className="!bg-[rgba(245,158,11,0.05)] !border-[rgba(245,158,11,0.2)]">{children}</pre>,
                    code: ({ children }) => <code className="!text-[var(--void-orange)]">{children}</code>,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              <div className="rounded-lg bg-[rgba(0,0,0,0.4)] border border-[rgba(245,158,11,0.2)] p-3 font-mono text-sm text-[var(--void-orange)] whitespace-pre-wrap">
                {message.codeOutput}
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)] rounded px-1.5 py-0.5 text-[var(--void-cyan)] text-[0.85em]" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--void-cyan)] hover:underline">
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-[var(--void-cyan)] pl-3 my-2 opacity-80">{children}</blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="min-w-full border border-[var(--void-border)]">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => <th className="border border-[var(--void-border)] px-2 py-1 bg-[var(--void-bg-tertiary)] text-left text-xs font-semibold">{children}</th>,
                  td: ({ children }) => <td className="border border-[var(--void-border)] px-2 py-1 text-xs">{children}</td>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* DeepThink Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[rgba(139,92,246,0.2)]">
              <p className="text-xs text-[var(--void-purple)] font-semibold mb-2">📚 Sources</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {message.sources.map((source) => (
                  <a
                    key={source.index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2 text-xs text-[var(--void-text-muted)] hover:text-[var(--void-purple)] transition-colors group"
                  >
                    <span className="text-[var(--void-purple)] font-mono flex-shrink-0">[{source.index}]</span>
                    <span className="truncate group-hover:text-[var(--void-text)]">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-[var(--void-text-muted)]">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    const text = codeRef.current?.textContent || '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[var(--void-text-muted)] hover:text-[var(--void-text)] transition-all opacity-0 group-hover:opacity-100"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-[var(--void-green)]" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre ref={codeRef} className="!bg-[rgba(0,0,0,0.4)] !border-[var(--void-border)] rounded-lg p-3 overflow-x-auto text-xs leading-relaxed">
        {children}
      </pre>
    </div>
  );
}
