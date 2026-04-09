# Void-2 Training Dataset Specification

## Overview
This document specifies the training data requirements for Void-2, the linguistic model.
Total target: **90,000 examples** across four categories.

## Category 1: Creative Writing (30K examples)

### Source Type: Filtered from open-source literature datasets

### Subcategories
| Subcategory | Count | Description |
|------------|-------|-------------|
| Short Fiction | 8K | Stories under 2000 words |
| Poetry | 5K | Various forms: free verse, sonnet, haiku |
| Screenwriting | 4K | Dialogue-heavy script excerpts |
| Essays | 5K | Opinion pieces, reflective writing |
| Worldbuilding | 3K | Setting descriptions, character profiles |
| Journalistic | 5K | Article writing, reportage style |

### Quality Criteria
- Minimum 200 words per example
- Varied sentence structure (no repetitive patterns)
- Emotional range: joy, melancholy, tension, wonder
- No cliché endings or predictable plots

## Category 2: Technical Writing (20K examples)

### Source Type: Synthetic

### Subcategories
| Subcategory | Count | Description |
|------------|-------|-------------|
| Documentation | 8K | API docs, README files, tutorials |
| Blog Posts | 6K | Technical blog articles |
| Explainers | 6K | "How X works" deep dives |

### Quality Criteria
- Clear hierarchy of information
- Proper use of headings, lists, and emphasis
- Accessible to semi-technical audience
- Void Code examples where appropriate

## Category 3: Conversation (25K dialogues)

### Source Type: Filtered from open-source dialogue datasets

### Subcategories
| Subcategory | Count | Description |
|------------|-------|-------------|
| Casual Chat | 10K | Everyday conversation |
| Q&A | 8K | Information-seeking dialogues |
| Debate | 4K | Multi-perspective discussions |
| Teaching | 3K | Explaining concepts conversationally |

### Quality Criteria
- Natural turn-taking
- Context retention across turns
- Varied response lengths (not all 1-liners)
- Personality consistency

## Category 4: Analysis & Essays (15K examples)

### Source Type: Synthetic

### Subcategories
| Subcategory | Count | Description |
|------------|-------|-------------|
| Critical Analysis | 5K | Book/movie/tech reviews |
| Comparative | 5K | A vs B structured comparisons |
| Persuasive | 5K | Argumentative essays with evidence |

### Quality Criteria
- Multiple perspectives presented
- Evidence-based reasoning
- Logical structure (thesis → evidence → conclusion)
- Acknowledgment of counterarguments

## Data Pipeline

### Generation Pipeline
1. **Curation**: Select high-quality sources from open datasets
2. **Synthetic Generation**: GPT-4 for technical writing and analysis
3. **Style Transfer**: Convert to Void AI voice (clear, efficient, elegant)
4. **Length Filtering**: Reject examples under 100 words
5. **Quality Scoring**: Human + automated scoring (perplexity, diversity)
6. **Deduplication**: Min-hash filtering (threshold 0.8)
7. **Format Conversion**: Convert to ChatML format
8. **Token Count**: Verify all examples fit within 4096 token limit

### Storage
- Format: JSONL (one example per line)
- Compression: gzip
- Estimated size: ~600MB uncompressed, ~120MB compressed
