# Void-MOA: Mixture of Agents

> Two minds. One voice. Zero compromise.

## Overview
Void-MOA is the unified intelligence that routes between Void-1 (code) and Void-2 
(language), giving you the perfect balance of precision and eloquence.

## How It Works
1. User sends query
2. Router classifies intent (code / language / hybrid)
3. Routes to Void-1, Void-2, or both
4. Returns optimal response

## Quick Start
```bash
# Install both models first
ollama create void-1 -f models/void-1/Modelfile
ollama create void-2 -f models/void-2/Modelfile

# Use MOA router
python3 models/void-moa/router.py "Write a Python web scraper"
# Output: {"model": "void-1", "confidence": 0.85, "type": "code"}

python3 models/void-moa/router.py "Write a poem about mathematics"
# Output: {"model": "void-2", "confidence": 0.92, "type": "language"}
```
