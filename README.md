# Void-Core

**Void Code** — The Assembly Language of AI  
*A Pure Math-based, ultra-dense programming language built for AI generation and low-end device execution.*

> Two models. One voice. Zero compromise. Runs on 2GB RAM.

Void AI is an ultra-lightweight AI system with a three-model architecture designed for
local deployment on minimal hardware. Code like a machine. Write like a human.

---

## What is Void?

Void is a revolutionary programming language built from first principles as the **Assembly Language of Artificial Intelligence**. Unlike traditional programming languages designed for human readability, Void uses pure mathematical notation to achieve:

- **Ultra-Dense Syntax** — 1 line of Void = 50+ lines of Python
- **AI-Native Design** — Syntax is subset of math that LLMs already understand
- **Pure Mathematics** — Σ (sum), Π (product), ∫ (integral), set theory, linear algebra
- **100MB Binary** — Entire AI + knowledge base compressed to 100MB
- **Infinite Deep Thinking** — Recursive mathematical exploration without limits

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   User       │────→│   Void-MOA       │────→│  Void-1     │
│   Query      │     │   (Router)       │     │  Code Model │
└─────────────┘     │                  │     │  100MB      │
                    │  Intent classify │     └─────────────┘
                    │  Auto-route      │
                    │                  │     ┌─────────────┐
                    │                  │────→│  Void-2     │
                    │                  │     │  Language   │
                    └──────────────────┘     │  100MB      │
                                             └─────────────┘
```

### Three Model Architecture

| Model | Size | Purpose | Base |
|-------|------|---------|------|
| **Void-1** | 100MB | Code generation, agent mode, deep research | Qwen2.5-Coder-0.5B |
| **Void-2** | 100MB | Creative writing, analysis, conversation | Phi-3-mini-4k |
| **Void-MOA** | Router | Intent classification & routing | Keyword + Pattern |

---

## Features

- **Chat** — Natural conversation with auto-routing
- **DeepThink** — Multi-step research engine
- **Agent Mode** — Shell commands, file I/O, web search
- **Void Code** — Mathematical programming language
- **Local-First** — All models run locally via Ollama
- **Ultra-Light** — 2GB RAM, works on Raspberry Pi and Termux

---

## Quick Start

### One-Click Install

```bash
bash install.sh
```

### Manual Install

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Build models
ollama create void-1 -f models/void-1/Modelfile
ollama create void-2 -f models/void-2/Modelfile

# 3. Start server
python3 src/api/server.py
```

### Docker

```bash
# CPU only (2GB RAM)
docker compose -f docker/docker-compose.yml up -d

# GPU enabled
docker build -f docker/Dockerfile.gpu -t void-ai:gpu .
```

---

## CLI Usage

```bash
# Auto-route (MOA picks the best model)
void-ai "Write a fibonacci function"

# Explicit model selection
void-ai chat "Tell me a story"          # Void-2
void-ai code "Sort this array"          # Void-1
void-ai think "Explain quantum computing"  # Deep research
void-ai agent "List all Python files"   # Agent mode
void-ai serve                           # Start web server

# Void Code
void-code -e "→ 10!"                    # Execute expression
void-code program.void                   # Run .void file
void-code                               # Interactive REPL
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Chat with any model |
| `/api/deepthink` | POST | Deep research |
| `/api/agent` | POST | Execute agent commands |
| `/api/voidcode` | POST | Execute Void Code |
| `/api/models` | POST | List available models |
| `/api/router` | POST | Route query to model |
| `/api/status` | GET | Server status |

---

## Project Structure

```
Void-Core/
├── models/              # Ollama model definitions
│   ├── void-1/         # Code Model (100MB)
│   ├── void-2/         # Linguistic Model (100MB)
│   └── void-moa/       # Mixture of Agents Router
├── src/                # Python runtime
│   ├── core/           # Tokenizer, VM runtime, memory manager
│   ├── agent/          # Agent mode, DeepThink, tool registry
│   ├── nlp/            # Chat, creative writing, Void Code
│   └── api/            # Lightweight HTTP server
├── bin/                # CLI launchers
├── docker/             # Docker deployment
├── void-ai/            # Next.js web application
├── install.sh          # One-click installer
└── .github/            # CI/CD workflows
```

---

## Language Features

```
// Mathematical Operators
Σ_{i=1}^{n} x_i          // Summation
∏_{n=1}^{5} n            // Product
∫_0^π sin(x) dx          // Integration
∂f/∂x                    // Partial derivative

// Set Theory
{1, 2, 3}                // Set literal
x ∈ S                    // Membership
A ∪ B                    // Union
A ∩ B                    // Intersection
∀ x ∈ S { f(x) }        // Universal quantifier

// Linear Algebra
[[1,2],[3,4]]^T          // Matrix transpose
A · B                    // Matrix multiplication
det(M)                   // Determinant
eig(M)                   // Eigenvalues

// IO and Variables
x ← 42                   // Assignment
result → output          // Output to stdout
data → file.txt          // Write to file
```

### Ultra-Dense Expression

One line of Void often expresses what takes 50 lines in Python:

```python
# Python (5 lines)
import numpy as np
data = [1, 2, 3, 4, 5]
squared = [x**2 for x in data]
result = sum(squared)
print(result)
```

```
# Void (1 line)
Σ_{i ∈ {1,2,3,4,5}} i² → output
```

---

## Platform Support

| Platform | Architecture | Status |
|----------|-------------|--------|
| Linux | x86_64 | ✅ Supported |
| Linux | ARM64 | ✅ Supported |
| macOS | x86_64 | ✅ Supported |
| macOS | ARM64 (Apple Silicon) | ✅ Supported |
| Android | Termux (ARM) | ✅ Supported |
| Windows | WSL2 | ✅ Supported |

## Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2 GB | 4 GB |
| Disk | 500 MB | 1 GB |
| CPU | Any 64-bit | 4+ cores |
| GPU | None | Any NVIDIA/AMD |

---

## Roadmap

### Phase 1 (Current)
- ✅ Void language interpreter
- ✅ Three model architecture (Void-1, Void-2, Void-MOA)
- ✅ Ollama-compatible Modelfiles
- ✅ Lightweight Python runtime (2GB RAM)
- ✅ Agent mode with shell execution
- ✅ DeepThink research engine
- ✅ Void Code interpreter
- ✅ Docker deployment
- ✅ One-click installer
- ✅ GitHub Actions CI/CD

### Phase 2 (Planned)
- [ ] Model training (LoRA fine-tuning)
- [ ] Void-to-WASM compiler
- [ ] Mobile app (iOS/Android)
- [ ] Desktop app (Electron/Tauri)
- [ ] VSCode extension
- [ ] Void Package Manager

### Phase 3 (Future)
- [ ] Void neural network compiler
- [ ] Hardware acceleration (GPU/TPU)
- [ ] Distributed thinking network
- [ ] Vision capabilities
- [ ] Full neural architecture in Void

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Credits

**Void Core** was created as the assembly language of AI, designed from first principles to bridge the gap between mathematical knowledge in large language models and executable code.

**Created by:** TheStrongestOfTomorrow  
**GitHub:** https://github.com/TheStrongestOfTomorrow/Void-Core  
**License:** MIT

---

*The future of programming is pure mathematics. That future is Void.*
