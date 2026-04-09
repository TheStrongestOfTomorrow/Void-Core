'use client';

import { useState, useCallback } from 'react';

export interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  timestamp: number;
}

export function useAgent() {
  const [workingDir, setWorkingDir] = useState('/tmp');
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addTerminalLine = useCallback((type: TerminalLine['type'], content: string) => {
    setTerminalHistory((prev) => [
      ...prev,
      { type, content, timestamp: Date.now() },
    ]);
  }, []);

  const addCommandToHistory = useCallback((cmd: string) => {
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
  }, []);

  const navigateHistory = useCallback(
    (direction: 'up' | 'down') => {
      if (direction === 'up') {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          return commandHistory[commandHistory.length - 1 - newIndex];
        }
      } else {
        const newIndex = historyIndex - 1;
        if (newIndex >= 0) {
          setHistoryIndex(newIndex);
          return commandHistory[commandHistory.length - 1 - newIndex];
        }
        setHistoryIndex(-1);
      }
      return '';
    },
    [historyIndex, commandHistory]
  );

  const clearTerminal = useCallback(() => {
    setTerminalHistory([]);
  }, []);

  return {
    workingDir,
    setWorkingDir,
    terminalHistory,
    commandHistory,
    historyIndex,
    addTerminalLine,
    addCommandToHistory,
    navigateHistory,
    clearTerminal,
  };
}
