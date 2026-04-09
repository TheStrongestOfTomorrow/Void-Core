"""
Void Code Runtime — Lightweight VM
Target: 2GB RAM, single-file, zero dependencies beyond Python stdlib
"""
import math
import re
from typing import Any, Dict, List, Optional

class VoidRuntime:
    """Ultra-lightweight Void Code interpreter."""
    
    def __init__(self):
        self.env: Dict[str, Any] = {
            'pi': math.pi, 'e': math.e, 'PI': math.pi, 'E': math.e,
            'true': 1, 'false': 0, 'null': None,
        }
        self.functions = {
            'sin': math.sin, 'cos': math.cos, 'tan': math.tan,
            'asin': math.asin, 'acos': math.acos, 'atan': math.atan,
            'sqrt': math.sqrt, 'abs': abs, 'log': math.log, 'ln': math.log,
            'log2': math.log2, 'log10': math.log10, 'exp': math.exp,
            'ceil': math.ceil, 'floor': math.floor, 'round': round,
            'sign': lambda x: (x > 0) - (x < 0),
            'max': max, 'min': min, 'pow': pow,
            'sum': sum, 'len': len, 'mean': lambda a: sum(a)/len(a),
            'gcd': math.gcd, 'factorial': self._factorial,
            'fib': self._fibonacci,
        }
        self.output: List[str] = []
    
    def _factorial(self, n):
        r = 1
        for i in range(2, int(n) + 1): r *= i
        return r
    
    def _fibonacci(self, n):
        if n <= 1: return n
        a, b = 0, 1
        for _ in range(2, int(n) + 1): a, b = b, a + b
        return b
    
    def execute(self, code: str) -> str:
        self.output = []
        for line in code.split('\n'):
            line = line.strip()
            if not line or line.startswith('//'): continue
            
            # Print: → expression
            if line.startswith('→'):
                val = self.eval(line[1:].strip())
                self.output.append(self._fmt(val))
            # Assignment: x ← expr
            elif '←' in line:
                name, expr = line.split('←', 1)
                self.env[name.strip()] = self.eval(expr.strip())
            else:
                try:
                    val = self.eval(line)
                    self.output.append(self._fmt(val))
                except: pass
        
        return '\n'.join(self.output) if self.output else '(no output)'
    
    def eval(self, expr: str) -> Any:
        e = expr.replace('×', '*').replace('÷', '/').replace('−', '-')
        e = e.replace('^', '**').replace('mod', '%')
        e = e.replace('π', 'pi').replace('√', 'sqrt')
        e = e.replace('²', '**2').replace('³', '**3')
        e = re.sub(r'(\d+)!', r'factorial(\1)', e)
        e = e.replace('{', '[').replace('}', ']')
        e = re.sub(r'\[(\d+)\.\.(\d+)\]', r'_range(\1,\2)', e)
        
        # Replace identifiers with env values
        for name in sorted(self.env.keys(), key=len, reverse=True):
            e = re.sub(rf'\b{name}\b', repr(self.env[name]), e)
        for name in self.functions:
            e = re.sub(rf'\b{name}\b', name, e)
        
        scope = {**self.functions, '_range': lambda a, b: list(range(int(a), int(b)+1))}
        try:
            return eval(e, {"__builtins__": {}}, scope)
        except Exception as ex:
            raise ValueError(f"Eval error: {expr} -> {ex}")
    
    def _fmt(self, v) -> str:
        if isinstance(v, list):
            if len(v) > 20: return f'[{", ".join(map(str, v[:20]))}, ... ({len(v)} items)]'
            return str(v)
        if isinstance(v, float) and v == int(v): return str(int(v))
        if isinstance(v, float): return f'{v:.6g}'
        return str(v)

if __name__ == "__main__":
    import sys
    code = sys.argv[1] if len(sys.argv) > 1 else "→ 10!"
    rt = VoidRuntime()
    print(rt.execute(code))
