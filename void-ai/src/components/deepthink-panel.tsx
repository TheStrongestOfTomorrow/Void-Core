'use client';

import { useState, useEffect } from 'react';
import { Search, Globe, ChevronDown, Loader2, ExternalLink } from 'lucide-react';
import { type Message } from '@/hooks/use-chat';

interface DeepThinkPanelProps {
  message: Message | null;
  isLoading: boolean;
}

export default function DeepThinkPanel({ message, isLoading }: DeepThinkPanelProps) {
  const [showSources, setShowSources] = useState(false);

  if (!message && !isLoading) return null;

  return (
    <div className="space-y-3">
      {/* Loading state */}
      {isLoading && (
        <div className="glass rounded-xl p-4 border border-[rgba(139,92,246,0.2)]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[var(--void-purple)] animate-spin" />
            <div>
              <p className="text-sm font-medium text-[var(--void-purple)]">
                Researching...
              </p>
              <p className="text-xs text-[var(--void-text-muted)]">
                Searching the web for relevant information
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-2 rounded-full bg-[rgba(139,92,246,0.1)] animate-shimmer overflow-hidden" />
            <div className="h-2 rounded-full bg-[rgba(139,92,246,0.1)] animate-shimmer overflow-hidden w-3/4" />
            <div className="h-2 rounded-full bg-[rgba(139,92,246,0.1)] animate-shimmer overflow-hidden w-1/2" />
          </div>
        </div>
      )}

      {/* Search queries used */}
      {message?.queries && message.queries.length > 0 && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-3.5 h-3.5 text-[var(--void-purple)]" />
            <span className="text-xs font-medium text-[var(--void-purple)]">
              Search Queries
            </span>
          </div>
          <div className="space-y-1">
            {message.queries.map((query, i) => (
              <p key={i} className="text-xs text-[var(--void-text-muted)] font-mono pl-5">
                → {query}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {message?.sources && message.sources.length > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <button
            onClick={() => setShowSources(!showSources)}
            className="w-full flex items-center justify-between p-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[var(--void-purple)]" />
              <span className="text-xs font-medium text-[var(--void-purple)]">
                {message.sources.length} Sources Found
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[var(--void-text-muted)] transition-transform ${
                showSources ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showSources && (
            <div className="border-t border-[var(--void-border)] max-h-60 overflow-y-auto">
              {message.sources.map((source) => (
                <a
                  key={source.index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors border-b border-[var(--void-border)] last:border-0 group"
                >
                  <span className="text-xs font-mono text-[var(--void-purple)] bg-[rgba(139,92,246,0.1)] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                    [{source.index}]
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--void-text)] group-hover:text-[var(--void-purple)] transition-colors truncate">
                      {source.title}
                    </p>
                    <p className="text-xs text-[var(--void-text-muted)] mt-0.5 line-clamp-1">
                      {source.snippet}
                    </p>
                    <p className="text-[10px] text-[var(--void-text-muted)] mt-0.5 flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5" />
                      {source.host || source.url}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
