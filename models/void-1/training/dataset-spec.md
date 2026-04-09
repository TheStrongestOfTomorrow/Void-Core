# Void-1 Training Dataset Specification

## Overview
This document specifies the training data requirements for Void-1, the code intelligence model.
Total target: **85,000 examples** across four categories.

## Category 1: Void Code Corpus (50K pairs)

### Source Type: Synthetic (generated from Void Code language spec)

### Data Format
```json
{
  "messages": [
    {"role": "system", "content": "You are Void-1..."},
    {"role": "user", "content": "Write a function to calculate fibonacci numbers"},
    {"role": "assistant", "content": "fib(n) ← if n ≤ 1 → n else → fib(n-1) + fib(n-2)\n→ fib(10)"}
  ]
}
```

### Subcategories
| Subcategory | Count | Description |
|------------|-------|-------------|
| NL → Void Code | 20K | Natural language instructions to Void Code |
| Void Code → Explanation | 10K | Void Code to natural language explanation |
| Code Translation | 10K | Python/JS ↔ Void Code |
| Void Code Debug | 5K | Find and fix bugs in Void Code |
| Math Expressions | 5K | Natural language → mathematical notation |

### Quality Criteria
- All Void Code must follow the Void Code Language Specification v1.0
- Every code example must be executable by the Void Runtime
- Mathematical expressions must use proper Unicode notation (Σ, ∫, ∀, ∈)
- No hallucinated syntax — only valid Void Code tokens

## Category 2: Math Reasoning (20K examples)

### Source Type: Filtered from open-source datasets

### Datasets
- GSM8K (grade school math) — filtered for complexity
- MATH dataset — competition math problems
- Custom-generated: "Solve step-by-step using mathematical notation"

### Format
```json
{
  "messages": [
    {"role": "user", "content": "Prove that √2 is irrational"},
    {"role": "assistant", "content": "Proof by contradiction:\nAssume √2 = p/q where p,q ∈ ℤ, gcd(p,q) = 1\n..."}
  ]
}
```

## Category 3: Agent Traces (10K trajectories)

### Source Type: Synthetic

### Format — Multi-turn tool use
```json
{
  "messages": [
    {"role": "user", "content": "Find all Python files larger than 1MB in the current directory"},
    {"role": "assistant", "content": "[SHELL] find . -name '*.py' -size +1M [/SHELL]\n[SHELL] ls -lh large_file.py [/SHELL]"},
    {"role": "user", "content": "What's in the largest file?"},
    {"role": "assistant", "content": "[FILE] large_file.py [/FILE]"}
  ]
}
```

## Category 4: Deep Research Chains (5K chains)

### Source Type: Synthetic

### Format — Multi-step research
```json
{
  "messages": [
    {"role": "user", "content": "Research the performance characteristics of B-trees vs LSM trees"},
    {"role": "assistant", "content": "Research Plan:\n1. [SEARCH] B-tree write performance benchmarks\n2. [SEARCH] LSM tree write amplification\n3. [ANALYZE] Compare write throughput: B-tree O(log n) vs LSM O(1)\n4. [SYNTHESIZE] Write comparison with citations"}
  ]
}
```

## Data Pipeline

### Generation Pipeline
1. **Template Generation**: Create prompt templates for each subcategory
2. **Synthetic Generation**: Use GPT-4 to generate Void Code examples
3. **Validation**: Run all Void Code through Void Runtime for correctness
4. **Deduplication**: Min-hash similarity filtering (threshold 0.85)
5. **Quality Score**: GPT-4 rating (1-5), reject below 3.5
6. **Format Conversion**: Convert to ChatML format
7. **Token Count**: Verify all examples fit within 8192 token limit

### Storage
- Format: JSONL (one example per line)
- Compression: gzip
- Estimated size: ~500MB uncompressed, ~100MB compressed
