# Void-MOA Training Dataset Specification

## Overview
Void-MOA is not a separate model — it is a routing layer that classifies user intent
and delegates to Void-1 (code) or Void-2 (language). This document specifies the
training data for the intent classifier router.

## Router Architecture
- Type: Lightweight text classifier
- Parameters: ~5M (for fast inference)
- Input: User query text
- Output: {model: "void-1" | "void-2" | "void-moa", confidence: float, type: "code" | "language" | "hybrid"}

## Dataset: Intent Classification (10K labeled queries)

### Categories and Distribution
| Category | Count | Description | Routes To |
|----------|-------|-------------|-----------|
| code | 4K | Programming, debugging, algorithms, math, data | void-1 |
| language | 4K | Writing, analysis, conversation, creative | void-2 |
| hybrid | 2K | Code + explanation, technical docs, tutorials | void-moa |

### Code Intent Examples
```
"Write a Python function to sort a linked list"          → void-1
"Debug this React component that's not rendering"        → void-1
"Calculate the time complexity of this algorithm"        → void-1
"Run `npm install` and fix the errors"                   → void-1
"Create a SQL query for joining three tables"            → void-1
"Convert this Python code to Rust"                       → void-1
"```python\ndef hello(): pass\n``` What's wrong?"        → void-1
"Explain ∫₀^∞ e^(-x²) dx"                               → void-1
```

### Language Intent Examples
```
"Write a short story about time travel"                  → void-2
"What are the philosophical implications of AI?"         → void-2
"Compare and contrast democracy vs republic"             → void-2
"Help me write a cover letter for a tech job"            → void-2
"Tell me a creative bedtime story"                       → void-2
"Analyze the themes in 1984 by George Orwell"            → void-2
"What's your opinion on remote work?"                    → void-2
"Summarize the key points of this article"               → void-2
```

### Hybrid Intent Examples
```
"Write documentation for this API endpoint"              → void-moa
"Explain how this sorting algorithm works"               → void-moa
"Create a tutorial on building a REST API"               → void-moa
"Write a blog post about this new JavaScript feature"    → void-moa
"Describe what this code does in plain English"          → void-moa
```

## Data Quality Criteria
- Queries must be realistic user inputs (not synthetic-sounding)
- Edge cases: ambiguous queries that could go either way
- Include multi-sentence queries (not just single sentences)
- Include queries with code snippets embedded
- Include misspelled queries and informal language

## Training Strategy
1. **Phase 1**: Train keyword + regex classifier (current implementation)
2. **Phase 2**: Fine-tune lightweight transformer on labeled data
3. **Phase 3**: Add confidence calibration with temperature scaling
4. **Phase 4**: A/B test against keyword baseline

## Evaluation
- Accuracy on held-out test set (target: >95%)
- F1-score per category (target: >0.90)
- Latency: <10ms per classification
- False positive rate for unsafe commands: <0.1%
