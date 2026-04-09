# Void-1: The Code Model

> 100MB. Precise. Mathematical. Dangerous.

## Overview
Void-1 is the code intelligence engine of Void AI. Built on Qwen2.5-Coder-0.5B and 
fine-tuned on Void Code corpus, it's a 100MB quantized powerhouse that runs on 2GB RAM.

## Capabilities
- **Code Generation**: Python, JavaScript, C++, Rust, Go, SQL, HTML/CSS, Bash, Void Code
- **Agent Mode**: Shell commands, file I/O, system operations
- **Deep Research**: Web search, source synthesis, citation generation
- **Math Engine**: Native support for Σ, ∫, ∀, ∈ notation

## Quick Start (Ollama)
```bash
# Pull and run
ollama create void-1 -f Modelfile
ollama run void-1 "Write a fibonacci function in Void Code"

# Use with API
curl http://localhost:11434/api/generate -d '{
  "model": "void-1",
  "prompt": "Analyze this dataset: [23, 45, 12, 67, 34]"
}'
```

## Resource Requirements
| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2 GB | 4 GB |
| Storage | 150 MB | 200 MB |
| CPU | ARM64/x86_64 | 4+ cores |
| GPU | None | Any (faster) |

## Training Details
- Base model: Qwen2.5-Coder-0.5B
- Quantization: Q4_K_M (4-bit)
- Training data: 85K examples
- Fine-tuning method: LoRA (rank 16)
