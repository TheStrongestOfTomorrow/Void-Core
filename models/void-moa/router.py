#!/usr/bin/env python3
"""
Void-MOA Router: Classifies user intent and routes to optimal model.
Routes between Void-1 (code) and Void-2 (language).

Intent Classification uses lightweight keyword + pattern matching:
- Code keywords: "code", "function", "bug", "debug", "api", "script", "compile", 
  "algorithm", "data", "sql", "html", "css", "python", "javascript", "terminal",
  "shell", "command", "file", "directory", "install", "build", "run", "execute",
  math symbols, code blocks
- Language keywords: "write", "story", "essay", "explain", "analyze", "describe",
  "tell me", "what is", "how does", "opinion", "review", "summarize", "creative"

Binary: 0 = Void-1 (Code), 1 = Void-2 (Language), 0.5 = Both (Hybrid)
"""

import re
import json

CODE_PATTERNS = [
    r'\b(code|function|class|method|variable|loop|array|object|api|endpoint)\b',
    r'\b(debug|error|bug|fix|compile|build|deploy|test|run)\b',
    r'\b(python|javascript|typescript|java|c\+\+|rust|go|sql|html|css|bash)\b',
    r'\b(shell|terminal|command|script|directory|file|install|package)\b',
    r'\b(algorithm|data\s+structure|sort|search|matrix|tensor|neural)\b',
    r'\b(regression|classification|model|train|dataset|loss|gradient)\b',
    r'[{}()\[\]=;]',  # Code syntax characters
    r'```',            # Code blocks
    r'[Σ∫∀∈∂∇√π]',   # Math symbols
]

LANGUAGE_PATTERNS = [
    r'\b(write|story|essay|poem|article|blog|script|novel)\b',
    r'\b(explain|describe|analyze|compare|contrast|review|summarize)\b',
    r'\b(tell\s+me|what\s+is|how\s+does|why\s+is|opinion|thought)\b',
    r'\b(creative|imagine|brainstorm|idea|concept|theory)\b',
    r'\b(emotion|feeling|experience|perspective|narrative)\b',
]

def classify_intent(query: str) -> dict:
    """Classify user intent and return routing decision."""
    query_lower = query.lower()
    
    code_score = sum(1 for p in CODE_PATTERNS if re.search(p, query_lower, re.IGNORECASE))
    lang_score = sum(1 for p in LANGUAGE_PATTERNS if re.search(p, query_lower, re.IGNORECASE))
    
    total = code_score + lang_score + 0.001  # avoid div by zero
    
    if code_score > lang_score * 2:
        return {"model": "void-1", "confidence": round(code_score / total, 2), "type": "code"}
    elif lang_score > code_score * 2:
        return {"model": "void-2", "confidence": round(lang_score / total, 2), "type": "language"}
    else:
        return {"model": "void-moa", "confidence": 0.5, "type": "hybrid"}

# CLI interface
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: router.py <query>"}))
        sys.exit(1)
    
    result = classify_intent(" ".join(sys.argv[1:]))
    print(json.dumps(result, indent=2))
