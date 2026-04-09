'use client';

import { useRef, useEffect } from 'react';
import { type Message, type Mode } from '@/hooks/use-chat';
import MessageBubble from './message-bubble';

interface ChatPanelProps {
  messages: Message[];
  mode: Mode;
  loading: boolean;
}

export default function ChatPanel({ messages, mode, loading }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return <WelcomeScreen mode={mode} />;
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2">
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isLatest={idx === messages.length - 1}
          isStreaming={loading && idx === messages.length - 1 && msg.role === 'assistant'}
        />
      ))}
      {loading && messages[messages.length - 1]?.role !== 'assistant' && (
        <MessageBubble
          message={{
            id: 'loading',
            role: 'assistant',
            content: '',
            mode,
            timestamp: Date.now(),
          }}
          isLatest
          isStreaming
        />
      )}
    </div>
  );
}

interface WelcomeScreenProps {
  mode: Mode;
}

function WelcomeScreen({ mode }: WelcomeScreenProps) {
  const modeExamples: Record<Mode, Array<{ title: string; prompt: string }>> = {
    chat: [
      { title: 'Explain quantum computing', prompt: 'Explain quantum computing in simple terms with mathematical foundations' },
      { title: 'Write a Python script', prompt: 'Write a Python script that analyzes a CSV file and generates summary statistics' },
      { title: 'Mathematical proof', prompt: 'Prove that the square root of 2 is irrational using contradiction' },
      { title: 'Compare algorithms', prompt: 'Compare time complexity of QuickSort vs MergeSort with examples' },
    ],
    deepthink: [
      { title: 'Latest AI breakthroughs', prompt: 'What are the most significant AI breakthroughs in 2025?' },
      { title: 'Research a topic', prompt: 'Compare React Server Components vs traditional SSR approaches' },
      { title: 'Technical analysis', prompt: 'How do transformers work in deep learning? Include recent advances.' },
      { title: 'Market research', prompt: 'What is the current state of quantum computing commercially?' },
    ],
    agent: [
      { title: 'System info', prompt: 'uname -a' },
      { title: 'List files', prompt: 'ls -la /tmp' },
      { title: 'Node version', prompt: 'node --version && npm --version' },
      { title: 'Disk usage', prompt: 'df -h' },
    ],
    voidcode: [
      { title: 'Fibonacci', prompt: '→ [fib(i) : i ∈ [0..15]]' },
      { title: 'Statistics', prompt: 'data ← [23, 45, 12, 67, 34, 56, 78, 90, 11, 43]\n→ mean(data)\n→ sum(data)' },
      { title: 'Trigonometry', prompt: 'angle ← pi / 4\n→ sin(angle)\n→ cos(angle)' },
      { title: 'Factorial', prompt: '→ factorial(10)' },
    ],
  };

  const examples = modeExamples[mode] || modeExamples.chat;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="space-y-3">
          <div className="text-6xl">⚡</div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-[var(--void-cyan)] text-glow-cyan">VOID</span>{' '}
            <span className="text-[var(--void-text)]">AI</span>
          </h1>
          <p className="text-sm text-[var(--void-text-muted)] font-mono">
            The Assembly Language of AI
          </p>
        </div>

        {/* Mode description */}
        <div className="glass rounded-xl p-4 text-sm text-[var(--void-text-muted)]">
          {mode === 'chat' && 'Standard AI conversation — ask me anything about coding, math, science, or creative writing.'}
          {mode === 'deepthink' && 'Deep research powered by web search — I\'ll find, analyze, and synthesize information from multiple sources.'}
          {mode === 'agent' && 'Terminal interface — execute shell commands directly. Be careful with what you run!'}
          {mode === 'voidcode' && 'Void Code playground — write and execute math-based code using the Void Code language.'}
        </div>

        {/* Example prompts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {examples.map((ex) => (
            <div
              key={ex.title}
              className="glass glass-hover rounded-lg p-3 cursor-pointer transition-all duration-200 group"
              onClick={() => {
                // Emit a custom event that the parent can listen to
                const event = new CustomEvent('void-example-click', { detail: { prompt: ex.prompt } });
                window.dispatchEvent(event);
              }}
            >
              <p className="text-sm font-medium text-[var(--void-text)] group-hover:text-[var(--void-cyan)] transition-colors">
                {ex.title}
              </p>
              <p className="text-xs text-[var(--void-text-muted)] mt-1 line-clamp-2 font-mono">
                {ex.prompt}
              </p>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-xs text-[var(--void-text-muted)]">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] border border-[var(--void-border)] text-[var(--void-text)]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] border border-[var(--void-border)] text-[var(--void-text)]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
