import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { output: 'No code provided.', exitCode: 1 },
        { status: 400 }
      );
    }

    const result = interpretVoidCode(code);
    return NextResponse.json({ output: result, exitCode: 0 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ output: `Error: ${err.message}`, exitCode: 1 });
  }
}

function interpretVoidCode(code: string): string {
  const env: Record<string, unknown> = {
    pi: Math.PI,
    PI: Math.PI,
    e: Math.E,
    E: Math.E,
    true: true,
    false: false,
    null: null,
  };

  const mathFuncs: Record<string, (...args: unknown[]) => unknown> = {
    sin: (a: number) => Math.sin(Number(a)),
    cos: (a: number) => Math.cos(Number(a)),
    tan: (a: number) => Math.tan(Number(a)),
    asin: (a: number) => Math.asin(Number(a)),
    acos: (a: number) => Math.acos(Number(a)),
    atan: (a: number) => Math.atan(Number(a)),
    sqrt: (a: number) => Math.sqrt(Number(a)),
    abs: (a: number) => Math.abs(Number(a)),
    log: (a: number) => Math.log(Number(a)),
    ln: (a: number) => Math.log(Number(a)),
    log10: (a: number) => Math.log10(Number(a)),
    log2: (a: number) => Math.log2(Number(a)),
    exp: (a: number) => Math.exp(Number(a)),
    ceil: (a: number) => Math.ceil(Number(a)),
    floor: (a: number) => Math.floor(Number(a)),
    round: (a: number) => Math.round(Number(a)),
    sign: (a: number) => Math.sign(Number(a)),
    max: (...a: number[]) => Math.max(...a.map(Number)),
    min: (...a: number[]) => Math.min(...a.map(Number)),
    pow: (a: number, b: number) => Math.pow(Number(a), Number(b)),
    factorial: (n: number) => {
      const num = Math.floor(Number(n));
      if (num < 0) return NaN;
      let r = 1;
      for (let i = 2; i <= num; i++) r *= i;
      return r;
    },
    fib: (n: number) => {
      const num = Math.floor(Number(n));
      if (num <= 1) return num;
      let a = 0,
        b = 1;
      for (let i = 2; i <= num; i++) [a, b] = [b, a + b];
      return b;
    },
    mean: (arr: number[]) => {
      const a = Array.isArray(arr) ? arr : [Number(arr)];
      return a.reduce((s: number, v: number) => s + Number(v), 0) / a.length;
    },
    sum: (arr: number[]) => {
      const a = Array.isArray(arr) ? arr : [Number(arr)];
      return a.reduce((s: number, v: number) => s + Number(v), 0);
    },
    len: (arr: number[]) => (Array.isArray(arr) ? arr.length : String(arr).length),
    sort: (arr: number[]) => (Array.isArray(arr) ? [...arr].sort((a, b) => Number(a) - Number(b)) : arr),
    reverse: (arr: number[]) => (Array.isArray(arr) ? [...arr].reverse() : arr),
    map: (arr: number[], fn: (v: number, i: number) => number) => {
      if (Array.isArray(arr) && typeof fn === 'function') return arr.map(fn);
      return arr;
    },
    filter: (arr: number[], fn: (v: number) => boolean) => {
      if (Array.isArray(arr) && typeof fn === 'function') return arr.filter(fn);
      return arr;
    },
  };

  const outputs: string[] = [];

  const lines = code
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('//'));

  for (const line of lines) {
    const trimmed = line.trim();

    try {
      // Print statement: → expression
      if (trimmed.startsWith('→')) {
        const expr = trimmed.slice(1).trim();
        if (!expr) continue;
        const value = evaluate(expr, env, mathFuncs);
        outputs.push(formatValue(value));
        continue;
      }

      // Assignment: x ← expression
      if (trimmed.includes('←')) {
        const arrowIdx = trimmed.indexOf('←');
        const varName = trimmed.slice(0, arrowIdx).trim();
        const expr = trimmed.slice(arrowIdx + 1).trim();
        if (varName && expr) {
          env[varName] = evaluate(expr, env, mathFuncs);
        }
        continue;
      }

      // Display statement: display expression or show expression
      if (trimmed.startsWith('display ') || trimmed.startsWith('show ')) {
        const expr = trimmed.replace(/^(display|show)\s+/, '').trim();
        const value = evaluate(expr, env, mathFuncs);
        outputs.push(formatValue(value));
        continue;
      }

      // Try to evaluate as expression
      const value = evaluate(trimmed, env, mathFuncs);
      if (value !== undefined) {
        outputs.push(formatValue(value));
      }
    } catch {
      outputs.push(`Error evaluating: ${trimmed}`);
    }
  }

  return outputs.length > 0 ? outputs.join('\n') : '(no output)';
}

function evaluate(
  expr: string,
  env: Record<string, unknown>,
  mathFuncs: Record<string, (...args: unknown[]) => unknown>
): unknown {
  let jsExpr = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\bmod\b/g, '%')
    .replace(/²/g, '**2')
    .replace(/³/g, '**3')
    .replace(/\^/g, '**')
    .replace(/ℝ/g, 'Number')
    .replace(/ℤ/g, 'Number')
    .replace(/∈/g, 'in');

  // Replace factorial notation: n!
  jsExpr = jsExpr.replace(/(\d+)!/g, 'factorial($1)');

  // Set literal: {1, 2, 3} → [1, 2, 3]
  jsExpr = jsExpr.replace(/\{([^}]+)\}/g, '[$1]');

  // Range: [1..10] → create array
  jsExpr = jsExpr.replace(
    /\[(\d+)\.\.(\d+)\]/g,
    (_, start, end) =>
      `Array.from({length:(${end}-${start}+1)}, (_,i) => ${start}+i)`
  );

  // Replace sqrt notation: √(x) → Math.sqrt(x)
  jsExpr = jsExpr.replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
  jsExpr = jsExpr.replace(/√(\d+)/g, 'Math.sqrt($1)');

  // Replace abs: |x| → Math.abs(x)
  jsExpr = jsExpr.replace(/\|([^|]+)\|/g, 'Math.abs($1)');

  // Replace variable names from env (longer names first to avoid partial matches)
  const sortedEnvKeys = Object.keys(env).sort((a, b) => b.length - a.length);
  for (const key of sortedEnvKeys) {
    const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const val = env[key];
    if (typeof val === 'string') {
      jsExpr = jsExpr.replace(regex, JSON.stringify(val));
    } else if (typeof val === 'number' || typeof val === 'boolean' || val === null) {
      jsExpr = jsExpr.replace(regex, String(val));
    } else if (Array.isArray(val)) {
      jsExpr = jsExpr.replace(regex, JSON.stringify(val));
    }
  }

  // Replace math function names (longer names first)
  const sortedFuncKeys = Object.keys(mathFuncs).sort((a, b) => b.length - a.length);
  for (const key of sortedFuncKeys) {
    // Only replace function calls, not partial matches
    const funcRegex = new RegExp(`\\b${key}\\s*\\(`, 'g');
    jsExpr = jsExpr.replace(funcRegex, `${key}(`);
  }

  // Create evaluation function
  const funcParamNames = Object.keys(mathFuncs);
  const funcParamValues = Object.values(mathFuncs);

  try {
    const fn = new Function('factorial', 'Math', ...funcParamNames, `"use strict"; return (${jsExpr});`);
    return fn(mathFuncs['factorial'], Math, ...funcParamValues);
  } catch {
    throw new Error(`Cannot evaluate: ${expr}`);
  }
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) {
    if (value.length <= 20) return `[${value.map(formatValue).join(', ')}]`;
    return `[${value.slice(0, 20).map(formatValue).join(', ')}, ... (${value.length} items)]`;
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    if (!Number.isFinite(value)) return String(value);
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(8).replace(/\.?0+$/, '');
  }
  if (typeof value === 'function') return '[Function]';
  return String(value);
}
