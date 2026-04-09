#!/usr/bin/env python3
"""
Void Model Trainer — Train Void Code-native AI models
Usage: python train_void_model.py --model void-1 --epochs 3 --data ./data/

This script trains models that NATIVELY understand Void Code —
not prompt-wrapped base models, but genuinely fine-tuned on Void Code syntax.
"""
import argparse
import json
import os
from pathlib import Path

try:
    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
    from peft import LoraConfig, get_peft_model, TaskType
    from datasets import Dataset
    import torch
except ImportError:
    print("Install dependencies: pip install transformers peft datasets torch accelerate")
    exit(1)

# Void Code token mappings — these get added to the tokenizer
VOID_CODE_TOKENS = {
    # Math operators
    "\u03a3": 32000, "\u03a0": 32001, "\u222b": 32002, "\u2202": 32003, "\u2207": 32004,
    "\u221a": 32005, "\u221e": 32006, "\u2203": 32007, "\u2200": 32008, "\u2208": 32009,
    "\u2209": 32010, "\u222a": 32011, "\u2229": 32012, "\u2286": 32013, "\u2282": 32014,
    "\u2205": 32015, "\u00ac": 32016, "\u2227": 32017, "\u2228": 32018, "\u2295": 32019,
    "\u00d7": 32020, "\u00f7": 32021, "\u2190": 32022, "\u2192": 32023, "\u21a6": 32024,
    "\u21d2": 32025, "\u21d4": 32026, "\u03b4": 32027, "\u03b5": 32028, "\u03b8": 32029,
    "\u03c6": 32030, "\u03c9": 32031, "\u03c0": 32032, "\u03bc": 32033, "\u03c3": 32034,
    "\u03c4": 32035, "\u03bb": 32036, "\u2124": 32037, "\u211d": 32038, "\u2102": 32039,
    "\ud835\udd4a": 32040, "\ud835\udd40": 32041, "\ud835\udd3d": 32042, "\ud835\udd39": 32043,
    "\u2212": 32044, "\u2260": 32045, "\u2264": 32046, "\u2265": 32047,
    "\u25b3": 32048, "\u207b\u00b9": 32049, "\u2016": 32050,
}

MODEL_CONFIGS = {
    "void-1": {
        "base_model": "meta-llama/Llama-3.2-3B-Instruct",
        "description": "Void Code-native code model",
        "lora_rank": 16,
        "lora_alpha": 32,
        "max_seq_length": 8192,
        "learning_rate": 2e-5,
        "batch_size": 4,
        "epochs": 3,
    },
    "void-2": {
        "base_model": "meta-llama/Llama-3.2-3B-Instruct",
        "description": "Void Code-aware linguistic model",
        "lora_rank": 16,
        "lora_alpha": 32,
        "max_seq_length": 4096,
        "learning_rate": 1e-5,
        "batch_size": 4,
        "epochs": 2,
    },
}

# System prompts baked into training data (NOT prompt engineering at inference time)
VOID_1_TRAINING_PROMPT = """You are Void-1, the code intelligence engine. You generate Void Code natively.
Void Code uses mathematical notation: \u2190 for assignment, \u2192 for output, \u03a3 for summation,
\u222b for integration, \u2200 for universal quantifier, \u2208 for set membership, [condition] for
Iverson brackets (conditional), \u03bb for lambda functions. Types: \u2124 \u211d \u2102 \ud835\udd4a \ud835\udd40 \ud835\udd3d \ud835\udd39 \u2205.
Always generate Void Code as the primary solution."""

VOID_2_TRAINING_PROMPT = """You are Void-2, the linguistic engine. You understand Void Code and can
explain it beautifully. Write with clarity, depth, and elegance. Use markdown formatting."""


def prepare_void_code_dataset(data_dir: str, model_type: str):
    """Load and format training data from Void Code examples."""
    examples = []
    data_path = Path(data_dir)

    if data_path.exists():
        for f in data_path.glob("*.jsonl"):
            with open(f) as fh:
                for line in fh:
                    examples.append(json.loads(line))

    # If no data, generate synthetic examples
    if not examples:
        examples = generate_synthetic_data(model_type)

    return Dataset.from_list(examples)


def generate_synthetic_data(model_type: str):
    """Generate synthetic Void Code training examples."""
    examples = []

    if model_type == "void-1":
        # Code generation examples in Void Code
        code_examples = [
            {
                "input": "Write a fibonacci function",
                "output": "fib(0) = 0\nfib(1) = 1\nfib(n) = fib(n\u22121) + fib(n\u22122), \u2200n \u2265 2\n\u2192 [fib(i) : i \u2208 [0..20]]",
            },
            {"input": "Calculate factorial of 10", "output": "\u2192 10!"},
            {"input": "Sort an array", "output": "data \u2190 [5, 3, 8, 1, 9, 2]\n\u2192 sort(data)"},
            {
                "input": "Calculate mean and standard deviation",
                "output": "data \u2190 [23, 45, 12, 67, 34]\n\u03bc \u2190 mean(data)\n\u03c3 \u2190 stddev(data)\n\u2192 (\u03bc, \u03c3)",
            },
            {"input": "Matrix multiplication", "output": "A \u2190 [[1,2],[3,4]]\nB \u2190 [[5,6],[7,8]]\n\u2192 A \u00b7 B"},
            {
                "input": "If-else: absolute value",
                "output": "abs(x) = [x \u2265 0] \u00d7 x + [x < 0] \u00d7 (\u2212x)\n\u2192 abs(\u221242)",
            },
            {"input": "Sum of first N numbers", "output": "N \u2190 100\n\u2192 \u03a3_{i=1}^{N} i"},
            {
                "input": "Check if number is prime",
                "output": "isPrime(n) = [n > 1] \u00d7 [\u2200d \u2208 [2..\u221an] : [n mod d \u2260 0]]\n\u2192 [isPrime(17)]",
            },
            {
                "input": "Generate even numbers from 1 to 20",
                "output": "\u2192 {x : x \u2208 [1..20], [x mod 2 = 0]}",
            },
            {"input": "Definite integral of x squared", "output": "\u2192 \u222b_0^1 x^2 dx"},
        ]

        for ex in code_examples:
            examples.append(
                {
                    "messages": [
                        {"role": "system", "content": VOID_1_TRAINING_PROMPT},
                        {"role": "user", "content": ex["input"]},
                        {"role": "assistant", "content": ex["output"]},
                    ]
                }
            )
    else:
        # Language examples
        lang_examples = [
            {
                "input": "Explain what Void Code is",
                "output": "Void Code is a programming language where every construct is mathematical notation...",
            },
            {
                "input": "Write a short story",
                "output": "The terminal glowed with an otherworldly light...",
            },
            {
                "input": "Explain the Iverson bracket",
                "output": "The Iverson bracket [P] is a mathematical notation that returns 1 if proposition P is true...",
            },
        ]

        for ex in lang_examples:
            examples.append(
                {
                    "messages": [
                        {"role": "system", "content": VOID_2_TRAINING_PROMPT},
                        {"role": "user", "content": ex["input"]},
                        {"role": "assistant", "content": ex["output"]},
                    ]
                }
            )

    return examples


def add_void_tokens(tokenizer):
    """Add Void Code Unicode tokens to the tokenizer vocabulary."""
    num_added = tokenizer.add_tokens(list(VOID_CODE_TOKENS.keys()))
    print(f"Added {num_added} Void Code tokens to tokenizer")
    return num_added


def train_model(model_type: str, data_dir: str, output_dir: str, epochs: int = None):
    """Train a Void Code-native model."""
    config = MODEL_CONFIGS[model_type]

    print(f"\n{'=' * 60}")
    print(f"  Training {model_type}: {config['description']}")
    print(f"  Base: {config['base_model']}")
    print(f"  LoRA Rank: {config['lora_rank']}")
    print(f"{'=' * 60}\n")

    # Load tokenizer and add Void Code tokens
    tokenizer = AutoTokenizer.from_pretrained(config["base_model"])
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    add_void_tokens(tokenizer)

    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        config["base_model"],
        torch_dtype=torch.float16,
        device_map="auto",
    )
    model.resize_token_embeddings(len(tokenizer))

    # Configure LoRA
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=config["lora_rank"],
        lora_alpha=config["lora_alpha"],
        lora_dropout=0.05,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
        bias="none",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Prepare data
    dataset = prepare_void_code_dataset(data_dir, model_type)

    # Training arguments
    training_args = TrainingArguments(
        output_dir=f"{output_dir}/{model_type}",
        num_train_epochs=epochs or config["epochs"],
        per_device_train_batch_size=config["batch_size"],
        gradient_accumulation_steps=8,
        learning_rate=config["learning_rate"],
        warmup_ratio=0.1,
        lr_scheduler_type="cosine",
        weight_decay=0.01,
        logging_steps=10,
        save_strategy="epoch",
        bf16=True,
        max_seq_length=config["max_seq_length"],
        gradient_checkpointing=True,
        optim="paged_adamw_32bit",
    )

    # Train
    from trl import SFTTrainer

    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        args=training_args,
        processing_class=tokenizer,
    )

    trainer.train()

    # Save LoRA weights
    model.save_pretrained(f"{output_dir}/{model_type}/lora")
    tokenizer.save_pretrained(f"{output_dir}/{model_type}/lora")

    print(f"\n\u2705 {model_type} trained successfully!")
    print(f"   LoRA weights saved to: {output_dir}/{model_type}/lora")
    print(f"\n   To merge and export:")
    print(f"   python train_void_model.py --merge --model {model_type} --output {output_dir}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Void Code-native AI models")
    parser.add_argument("--model", choices=["void-1", "void-2"], required=True)
    parser.add_argument("--data", default="./data", help="Training data directory")
    parser.add_argument("--output", default="./output", help="Output directory")
    parser.add_argument("--epochs", type=int, default=None, help="Override epochs")
    args = parser.parse_args()

    train_model(args.model, args.data, args.output, args.epochs)
