"""
Void Code Tokenizer — Unicode-aware BPE tokenizer specification.
This describes the tokenizer design for training Void models.
"""

VOID_VOCAB = {
    # Math operators
    "Σ": 0, "Π": 1, "∫": 2, "∂": 3, "∇": 4, "√": 5, "∞": 6,
    # Set theory
    "∈": 7, "∉": 8, "∪": 9, "∩": 10, "⊆": 11, "⊂": 12, "∅": 13,
    "∀": 14, "∃": 15, "¬": 16, "∧": 17, "∨": 18,
    # Arithmetic
    "+": 19, "−": 20, "×": 21, "÷": 22, "^": 23, "mod": 24,
    # Comparison
    "=": 25, "≠": 26, "<": 27, ">": 28, "≤": 29, "≥": 30,
    # Assignment
    "←": 31, "↦": 32, "→": 33,
    # Logic
    "⇒": 34, "⇔": 35, "⊕": 36,
    # Types
    "ℤ": 37, "ℝ": 38, "ℂ": 39, "𝕊": 40, "𝕄": 41, "𝕍": 42, "𝔹": 43,
    # Delimiters
    "[": 44, "]": 45, "(": 46, ")": 47, "{": 48, "}": 49,
    # Special
    "λ": 50, "δ": 51, "ε": 52, "θ": 53, "φ": 54, "ω": 55,
    "π": 56, "μ": 57, "σ": 58, "τ": 59,
}

TOKENIZER_CONFIG = {
    "vocab_size": 5000,
    "base_vocab": 256,  # ASCII
    "unicode_tokens": len(VOID_VOCAB),
    "bpe_merges": 4500,
    "special_tokens": ["<pad>", "<unk>", "<eos>", "<code>", "<math>", "<text>"],
    "max_token_length": 32,
}
