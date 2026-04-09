#!/usr/bin/env python3
"""Void Code CLI — Run .void files or expressions."""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.runtime import VoidRuntime

def main():
    if len(sys.argv) < 2:
        print("Void Code v1.0 — Usage: voidcode <file.void | -e 'expression'>")
        print()
        print("Examples:")
        print("  voidcode -e '→ 10!'")
        print("  voidcode program.void")
        print()
        print("Void Code Syntax:")
        print("  → expr          Print expression result")
        print("  x ← expr        Assign expression to variable")
        print("  // comment      Line comment")
        print()
        print("Built-in functions: sin, cos, tan, sqrt, abs, log, exp,")
        print("  ceil, floor, round, max, min, pow, sum, len, mean,")
        print("  gcd, factorial, fib")
        print()
        print("Constants: pi, e, true, false, null")
        sys.exit(1)
    
    if sys.argv[1] == "-e":
        if len(sys.argv) < 3:
            print("Error: No expression provided. Usage: voidcode -e 'expression'")
            sys.exit(1)
        code = sys.argv[2]
    else:
        filepath = sys.argv[1]
        if not os.path.exists(filepath):
            print(f"Error: File not found: {filepath}")
            sys.exit(1)
        with open(filepath) as f:
            code = f.read()
    
    rt = VoidRuntime()
    result = rt.execute(code)
    print(result)

if __name__ == "__main__":
    main()
