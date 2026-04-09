'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Mode } from '@/hooks/use-chat';
import { useChat } from '@/hooks/use-chat';
import { useDeepThink } from '@/hooks/use-deep-think';
import { useAgent } from '@/hooks/use-agent';
import { useVoidCode } from '@/hooks/use-void-code';
import Sidebar from './sidebar';
import Header from './header';
import ChatPanel from './chat-panel';
import ChatInput from './chat-input';
import DeepThinkPanel from './deepthink-panel';
import AgentTerminal from './agent-terminal';
import VoidCodeEditor from './void-code-editor';

export default function VoidAI() {
  const {
    conversations,
    currentConversation,
    loading,
    sendMessage,
    createConversation,
    deleteConversation,
    switchConversation,
    exportConversation,
  } = useChat();

  const { depth, setDepth } = useDeepThink();
  const agent = useAgent();
  const voidCode = useVoidCode();

  const [mode, setMode] = useState<Mode>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle example clicks from welcome screen
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.prompt) {
        if (mode === 'voidcode') {
          voidCode.setCode(detail.prompt);
          voidCode.runCode(detail.prompt);
        } else {
          handleSend(detail.prompt);
        }
      }
    };
    window.addEventListener('void-example-click', handler);
    return () => window.removeEventListener('void-example-click', handler);
  });

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      // Create new conversation for new mode if needed
      if (!currentConversation || currentConversation.mode !== newMode) {
        createConversation(newMode);
      }
      setSidebarOpen(false);
    },
    [currentConversation, createConversation]
  );

  const handleSend = useCallback(
    (content: string) => {
      if (mode === 'agent') {
        agent.addTerminalLine('input', content);
      }

      sendMessage(content, mode, {
        depth,
        workingDir: agent.workingDir,
      });
    },
    [mode, sendMessage, depth, agent]
  );

  const handleAgentCommand = useCallback(
    (command: string) => {
      agent.addTerminalLine('input', command);
      sendMessage(command, 'agent', { workingDir: agent.workingDir });
    },
    [agent, sendMessage]
  );

  const messages = currentConversation?.messages || [];
  const lastAssistantMessage =
    messages.length > 0 && messages[messages.length - 1].role === 'assistant'
      ? messages[messages.length - 1]
      : null;

  return (
    <div className="h-dvh w-full flex bg-[var(--void-bg)] bg-grid overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentMode={mode}
        onModeChange={handleModeChange}
        conversations={conversations}
        currentConversationId={currentConversation?.id || null}
        onSwitchConversation={(id) => {
          switchConversation(id);
          const convo = conversations.find((c) => c.id === id);
          if (convo) setMode(convo.mode);
          setSidebarOpen(false);
        }}
        onNewConversation={() => {
          createConversation(mode);
          setSidebarOpen(false);
        }}
        onDeleteConversation={deleteConversation}
        onExport={exportConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          mode={mode}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Content area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {mode === 'voidcode' ? (
            /* Void Code Mode: Full editor */
            <VoidCodeEditor
              code={voidCode.code}
              onCodeChange={voidCode.setCode}
              output={voidCode.output}
              isRunning={voidCode.isRunning}
              onRun={voidCode.runCode}
              onClearOutput={voidCode.clearOutput}
              examples={voidCode.EXAMPLE_SNIPPETS}
            />
          ) : mode === 'agent' ? (
            /* Agent Mode: Terminal */
            <div className="flex-1 flex flex-col overflow-hidden">
              <AgentTerminal
                terminalHistory={agent.terminalHistory}
                workingDir={agent.workingDir}
                onCommand={handleAgentCommand}
                onClear={agent.clearTerminal}
              />
            </div>
          ) : (
            /* Chat & DeepThink Modes: Chat interface */
            <>
              <ChatPanel messages={messages} mode={mode} loading={loading} />

              {/* DeepThink panel (shown when there's a deepthink result) */}
              {mode === 'deepthink' && (lastAssistantMessage || loading) && (
                <div className="max-w-3xl mx-auto w-full px-4 pb-2">
                  <DeepThinkPanel
                    message={
                      lastAssistantMessage?.sources
                        ? lastAssistantMessage
                        : null
                    }
                    isLoading={loading}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Input area (only for chat and deepthink modes) */}
        {(mode === 'chat' || mode === 'deepthink') && (
          <ChatInput
            mode={mode}
            onSend={handleSend}
            loading={loading}
            depth={depth}
            onDepthChange={setDepth}
          />
        )}
      </main>
    </div>
  );
}
