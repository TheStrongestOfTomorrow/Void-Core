'use client';

import { useState, useCallback, useEffect } from 'react';

export type Mode = 'chat' | 'deepthink' | 'agent' | 'voidcode';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode: Mode;
  timestamp: number;
  sources?: Array<{
    index: number;
    title: string;
    url: string;
    snippet: string;
    host: string;
  }>;
  queries?: string[];
  exitCode?: number;
  command?: string;
  isCode?: boolean;
  codeOutput?: string;
}

export interface Conversation {
  id: string;
  title: string;
  mode: Mode;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'void-ai-conversations';
const CURRENT_CONVO_KEY = 'void-ai-current-conversation';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConversation = conversations.find((c) => c.id === currentConversationId) || null;

  // Load conversations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConversations(JSON.parse(stored));
      }
      const currentId = localStorage.getItem(CURRENT_CONVO_KEY);
      if (currentId) {
        setCurrentConversationId(currentId);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save conversations to localStorage
  const saveToStorage = useCallback(
    (convos: Conversation[], currentId?: string) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
        if (currentId !== undefined) {
          localStorage.setItem(CURRENT_CONVO_KEY, currentId);
        }
      } catch {
        // ignore
      }
    },
    []
  );

  const createConversation = useCallback(
    (mode: Mode) => {
      const convo: Conversation = {
        id: generateId(),
        title: 'New Conversation',
        mode,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations((prev) => {
        const next = [convo, ...prev];
        saveToStorage(next, convo.id);
        return next;
      });
      setCurrentConversationId(convo.id);
      return convo.id;
    },
    [saveToStorage]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveToStorage(next, next[0]?.id);
        return next;
      });
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    },
    [currentConversationId, saveToStorage]
  );

  const switchConversation = useCallback(
    (id: string) => {
      setCurrentConversationId(id);
      saveToStorage(conversations, id);
    },
    [conversations, saveToStorage]
  );

  const addMessage = useCallback(
    (message: Omit<Message, 'id' | 'timestamp'>) => {
      const fullMessage: Message = {
        ...message,
        id: generateId(),
        timestamp: Date.now(),
      };

      let targetId = currentConversationId;
      if (!targetId) {
        targetId = generateId();
        const convo: Conversation = {
          id: targetId,
          title: 'New Conversation',
          mode: message.mode,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setConversations((prev) => [convo, ...prev]);
        setCurrentConversationId(targetId);
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetId) return c;
          const updated = {
            ...c,
            messages: [...c.messages, fullMessage],
            updatedAt: Date.now(),
          };
          // Auto-title: use first user message
          if (c.messages.length === 0 && message.role === 'user') {
            updated.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
          }
          return updated;
        })
      );

      return targetId;
    },
    [currentConversationId]
  );

  const updateLastAssistantMessage = useCallback((convoId: string, content: string, extra?: Partial<Message>) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convoId) return c;
        const msgs = [...c.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
          msgs[lastIdx] = { ...msgs[lastIdx], content, ...extra };
        }
        const updated = { ...c, messages: msgs, updatedAt: Date.now() };
        saveToStorage(
          prev.map((conv) => (conv.id === convoId ? updated : conv)),
          convoId
        );
        return updated;
      })
    );
  }, [saveToStorage]);

  const sendMessage = useCallback(
    async (content: string, mode: Mode, extra?: Record<string, unknown>) => {
      setError(null);
      setLoading(true);

      // Add user message
      addMessage({ role: 'user', content, mode });
      // Small delay to ensure state updates
      await new Promise((r) => setTimeout(r, 50));

      // Re-read current conversation id
      const convoId = currentConversationId || generateId();

      // Add placeholder assistant message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convoId) return c;
          return {
            ...c,
            messages: [
              ...c.messages,
              { id: generateId(), role: 'assistant' as const, content: '', mode, timestamp: Date.now() },
            ],
            updatedAt: Date.now(),
          };
        })
      );

      try {
        let result: string = '';
        let messageExtra: Partial<Message> = {};

        switch (mode) {
          case 'chat': {
            const msgs = (conversations.find((c) => c.id === convoId)?.messages || [])
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .map((m) => ({ role: m.role, content: m.content }))
              .slice(-20);

            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: msgs }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            result = data.message;
            break;
          }

          case 'deepthink': {
            const res = await fetch('/api/deepthink', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: content, depth: (extra?.depth as string) || 'quick' }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            result = data.answer;
            messageExtra = { sources: data.sources, queries: data.queries };
            break;
          }

          case 'agent': {
            const res = await fetch('/api/agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: content, workingDir: (extra?.workingDir as string) || '/tmp' }),
            });
            const data = await res.json();
            result = data.output || 'Command completed with no output.';
            messageExtra = { exitCode: data.exitCode, command: content };
            break;
          }

          case 'voidcode': {
            const res = await fetch('/api/voidcode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: content }),
            });
            const data = await res.json();
            result = data.output || 'Code executed successfully (no output).';
            messageExtra = { exitCode: data.exitCode, isCode: true, codeOutput: data.output };
            break;
          }
        }

        updateLastAssistantMessage(convoId, result, messageExtra);
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message);
        updateLastAssistantMessage(convoId, `Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [addMessage, currentConversationId, conversations, updateLastAssistantMessage]
  );

  const clearChat = useCallback(() => {
    if (!currentConversationId) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentConversationId) return c;
        return { ...c, messages: [], updatedAt: Date.now() };
      })
    );
  }, [currentConversationId]);

  const exportConversation = useCallback(() => {
    if (!currentConversation) return;
    const data = {
      format: 'void-ai-v1',
      exported: new Date().toISOString(),
      conversation: currentConversation,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentConversation.title.replace(/[^a-z0-9]/gi, '_')}.void`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentConversation]);

  return {
    conversations,
    currentConversation,
    currentConversationId,
    loading,
    error,
    sendMessage,
    clearChat,
    createConversation,
    deleteConversation,
    switchConversation,
    exportConversation,
  };
}
