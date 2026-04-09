'use client';

import { useState, useCallback } from 'react';

const EXAMPLE_SNIPPETS = [
  {
    name: 'Fibonacci Sequence',
    code: `// Fibonacci Numbers
→ [fib(i) : i ∈ [0..15]]`,
  },
  {
    name: 'Basic Math',
    code: `// Basic Math
x ← 42
y ← x^2 + 2*x + 1
→ y`,
  },
  {
    name: 'Trigonometry',
    code: `// Trigonometry
angle ← pi / 4
→ sin(angle)
→ cos(angle)
→ sin(angle)^2 + cos(angle)^2`,
  },
  {
    name: 'Statistics',
    code: `// Statistics
data ← [23, 45, 12, 67, 34, 56, 78, 90, 11, 43]
→ mean(data)
→ sum(data)
→ sort(data)`,
  },
  {
    name: 'Factorial',
    code: `// Factorial
→ factorial(10)
→ factorial(20)`,
  },
  {
    name: 'Range & Sum',
    code: `// Sum of first 100 natural numbers
→ sum([1..100])
// Sum of squares
→ sum(map([1..10], x → x^2))`,
  },
];

export function useVoidCode() {
  const [code, setCode] = useState('// Welcome to Void Code\n// Type your code here and press Run\n\n→ 42 + 58');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runCode = useCallback(async (codeContent: string) => {
    setIsRunning(true);
    setOutput('');

    try {
      const res = await fetch('/api/voidcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeContent }),
      });
      const data = await res.json();
      setOutput(data.output || '(no output)');
    } catch (err: unknown) {
      const error = err as Error;
      setOutput(`Runtime Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearOutput = useCallback(() => {
    setOutput('');
  }, []);

  return {
    code,
    setCode,
    output,
    isRunning,
    runCode,
    clearOutput,
    EXAMPLE_SNIPPETS,
  };
}
