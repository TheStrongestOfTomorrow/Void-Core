const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, PageBreak, SectionType,
  Tab, TabStopType, TabStopPosition, BorderStyle, ShadingType,
  PageNumber, NumberFormat, Header, Footer, convertInchesToTwip,
  LevelFormat, UnderlineType, LineRuleType, TableOfContents
} = require("docx");
const fs = require("fs");

// ============================================================
// PALETTE DM-1 (Dark Theme)
// ============================================================
const DM1 = {
  bg: "162235",
  primary: "FFFFFF",
  accent: "37DCF2",
  gray: "808080",
  tableHeaderBg: "1B6B7A",
  tableHeaderText: "FFFFFF",
  tableInnerLine: "C8DDE2",
  codeBg: "EDF3F5",
  bodyText: "333333",
  subtleText: "666666",
};

// ============================================================
// HELPERS
// ============================================================
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

const CODE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "D0D8DC" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D8DC" },
  left: { style: BorderStyle.SINGLE, size: 6, color: DM1.tableHeaderBg },
  right: { style: BorderStyle.SINGLE, size: 1, color: "D0D8DC" },
};

function emptyPara(spacing = {}) {
  return new Paragraph({
    spacing: { after: 100, ...spacing },
    children: [],
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 360, lineRule: LineRuleType.AUTO },
    ...opts,
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: 24, // 12pt
        color: DM1.bodyText,
      }),
    ],
  });
}

function bodyPara(runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 360, lineRule: LineRuleType.AUTO },
    ...opts,
    children: runs,
  });
}

function bodyRun(text, opts = {}) {
  return new TextRun({
    text,
    font: "Calibri",
    size: 24,
    color: DM1.bodyText,
    ...opts,
  });
}

function boldRun(text, opts = {}) {
  return new TextRun({
    text,
    font: "Calibri",
    size: 24,
    color: DM1.bodyText,
    bold: true,
    ...opts,
  });
}

function italicRun(text, opts = {}) {
  return new TextRun({
    text,
    font: "Calibri",
    size: 24,
    color: DM1.bodyText,
    italics: true,
    ...opts,
  });
}

function accentRun(text, opts = {}) {
  return new TextRun({
    text,
    font: "Calibri",
    size: 24,
    color: DM1.tableHeaderBg,
    bold: true,
    ...opts,
  });
}

function monoRun(text, opts = {}) {
  return new TextRun({
    text,
    font: "Consolas",
    size: 20, // 10pt
    color: "2D2D2D",
    ...opts,
  });
}

function codeBlock(lines) {
  const text = lines.join("\n");
  return new Table({
    width: { size: 100, type: "pctWidthOff" },
    margins: {
      top: convertInchesToTwip(0.05),
      bottom: convertInchesToTwip(0.05),
      left: convertInchesToTwip(0.15),
      right: convertInchesToTwip(0.15),
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: DM1.codeBg },
            borders: CODE_BORDERS,
            width: { size: 100, type: "pctWidthOff" },
            children: [
              new Paragraph({
                spacing: { after: 0, line: 276, lineRule: LineRuleType.AUTO },
                children: [
                  new TextRun({
                    text,
                    font: "Consolas",
                    size: 18, // 9pt
                    color: "2D2D2D",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function makeHeaderCell(text) {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, fill: DM1.tableHeaderBg },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: DM1.tableHeaderBg },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: DM1.tableInnerLine },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text,
            font: "Calibri",
            size: 20,
            bold: true,
            color: DM1.tableHeaderText,
          }),
        ],
      }),
    ],
  });
}

function makeDataCell(text, opts = {}) {
  return new TableCell({
    shading: opts.shading || { type: ShadingType.CLEAR, fill: "FFFFFF" },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: DM1.tableInnerLine },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: DM1.tableInnerLine },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
    },
    children: [
      new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text,
            font: opts.font || "Calibri",
            size: opts.size || 20,
            color: opts.color || DM1.bodyText,
            bold: opts.bold || false,
          }),
        ],
      }),
    ],
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: "pctWidthOff" },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(makeHeaderCell),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map((cell) =>
              typeof cell === "object" ? makeDataCell(cell.text, cell) : makeDataCell(cell)
            ),
          })
      ),
    ],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text,
        font: "Times New Roman",
        size: 36, // 18pt
        bold: true,
        color: DM1.tableHeaderBg,
      }),
    ],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [
      new TextRun({
        text,
        font: "Times New Roman",
        size: 28, // 14pt
        bold: true,
        color: DM1.tableHeaderBg,
      }),
    ],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text,
        font: "Times New Roman",
        size: 24, // 12pt
        bold: true,
        color: "3A7D8C",
      }),
    ],
  });
}

function spacer(pts = 100) {
  return new Paragraph({ spacing: { after: pts }, children: [] });
}

// ============================================================
// COVER PAGE SECTION
// ============================================================
function buildCoverSection() {
  return {
    properties: {
      page: {
        margin: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
        size: { width: 12240, height: 15840 },
      },
      type: SectionType.CONTINUOUS,
    },
    children: [
      // Spacer for vertical centering (use large spacing to avoid blank-page warning)
      new Paragraph({ spacing: { after: 2400 }, children: [] }),
      new Paragraph({ spacing: { after: 2400 }, children: [] }),
      new Paragraph({ spacing: { after: 2400 }, children: [] }),
      new Paragraph({ spacing: { after: 2400 }, children: [] }),
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: "VOID CODE",
            font: "Times New Roman",
            size: 72, // 36pt
            bold: true,
            color: DM1.primary,
          }),
        ],
      }),
      // Accent line
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
            font: "Calibri",
            size: 20,
            color: DM1.accent,
          }),
        ],
      }),
      // Subtitle
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: "The Assembly Language of AI",
            font: "Calibri",
            size: 32, // 16pt
            color: DM1.accent,
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: "Language Specification v1.0",
            font: "Calibri",
            size: 26,
            color: DM1.primary,
          }),
        ],
      }),
      // Spacer
      emptyPara(),
      emptyPara(),
      emptyPara(),
      emptyPara(),
      // Meta
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: "Void Core Project",
            font: "Calibri",
            size: 22,
            color: DM1.gray,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: "April 2026",
            font: "Calibri",
            size: 22,
            color: DM1.gray,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: "CONFIDENTIAL \u2014 INTERNAL SPECIFICATION",
            font: "Calibri",
            size: 18,
            color: DM1.gray,
          }),
        ],
      }),
    ],
  };
}

// ============================================================
// TOC SECTION
// ============================================================
function buildTocSection() {
  return {
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.25),
          right: convertInchesToTwip(1.25),
        },
      },
      type: SectionType.CONTINUOUS,
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 400 },
        children: [
          new TextRun({
            text: "TABLE OF CONTENTS",
            font: "Times New Roman",
            size: 36,
            bold: true,
            color: DM1.tableHeaderBg,
          }),
        ],
      }),
      // TOC field element
      new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-3",
      }),

      // TOC placeholder entries
      ...[
        "1.  Executive Summary",
        "2.  Design Philosophy",
        "    2.1  Math-First Principle",
        "    2.2  Density Principle",
        "    2.3  AI-Native Principle",
        "    2.4  Resource Efficiency",
        "3.  Type System",
        "4.  Syntax Reference",
        "    4.1  Assignment & Variables",
        "    4.2  Arithmetic Operators",
        "    4.3  Comparison & Logical Operators",
        "    4.4  Set Theory Operations",
        "    4.5  Linear Algebra",
        "    4.6  Calculus Notation",
        "    4.7  Control Flow: Iverson Brackets",
        "    4.8  Iteration: Mathematical Notation",
        "    4.9  Functions: Lambda & Mapping",
        "    4.10 I/O Operations",
        "5.  Complete Code Examples",
        "    5.1  Hello World",
        "    5.2  Fibonacci Sequence",
        "    5.3  Matrix Operations",
        "    5.4  Statistical Analysis",
        "    5.5  Neural Network Forward Pass",
        "    5.6  File System Operations",
        "6.  Formal Grammar Specification (BNF)",
        "7.  Standard Library",
        "    7.1  Core Mathematics",
        "    7.2  Trigonometry",
        "    7.3  Linear Algebra",
        "    7.4  Statistics & Probability",
        "    7.5  Calculus",
        "    7.6  Set Operations",
        "    7.7  String Operations",
        "    7.8  I/O & System",
        "8.  Execution Model",
        "    8.1  Stack-Based VM",
        "    8.2  Memory Layout",
        "    8.3  Bytecode Format",
        "    8.4  Compilation Pipeline",
        "9.  Comparison with Other Languages",
        "10. Phase 2 \u2014 Ecosystem Feasibility Analysis",
        "    10.1  The AI Compiler",
        "    10.2  Termux Integration",
        "    10.3  Decentralized Script Store",
        "    10.4  Summary Risk Matrix",
      ].map((entry) => {
        const isSub = entry.startsWith("    ");
        const cleaned = entry.trim();
        return new Paragraph({
          spacing: { after: isSub ? 40 : 80, line: 300, lineRule: LineRuleType.AUTO },
          indent: { left: isSub ? convertInchesToTwip(0.4) : 0 },
          children: [
            new TextRun({
              text: cleaned,
              font: "Calibri",
              size: isSub ? 22 : 24,
              color: DM1.bodyText,
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: convertInchesToTwip(6),
              leader: "dot",
            },
          ],
        });
      }),
    ],
  };
}

// ============================================================
// BODY SECTION
// ============================================================
function buildBody() {
  const children = [];

  // ========================
  // SECTION 1: Executive Summary
  // ========================
  children.push(heading1("1. Executive Summary"));

  children.push(
    bodyText(
      "Void Code is a revolutionary programming language designed from first principles to serve as the assembly language of artificial intelligence. Born from the observation that existing programming languages carry decades of human-interface baggage, Void Code strips away all English keywords and verbose syntax in favor of pure mathematical notation. The result is a language that is simultaneously the most expressive and the most compact programming language ever designed for computational work."
    )
  );
  children.push(
    bodyText(
      "The motivation behind Void Code stems from a fundamental shift in how software is created. As large language models (LLMs) become increasingly capable of generating code, the traditional design goal of making programming languages human-readable becomes secondary. Instead, the primary design goal shifts to making languages machine-optimizable and mathematically precise. Void Code embraces this shift entirely. Every construct in the language maps directly to a mathematical concept, making it trivially translatable between natural language descriptions and executable code by AI systems."
    )
  );
  children.push(
    bodyText(
      "Void Code achieves unprecedented code density: a single line of Void Code can express what would require 50 or more lines of Python. This is not compression for its own sake. Rather, it reflects the fact that mathematical notation is inherently information-dense. Where Python requires explicit loops, type annotations, and verbose function calls to compute a summation, Void Code uses the Sigma notation that mathematicians have used for centuries. The result is code that reads like a textbook proof yet executes as a program."
    )
  );
  children.push(
    bodyText(
      "Perhaps most importantly, Void Code is designed to run on resource-constrained devices with as little as 2GB of RAM. Its stack-based virtual machine uses fixed-size 64-bit value slots, eliminating garbage collection overhead entirely. Matrices are stored in row-major order, and the bytecode format uses compact 32-bit instructions. This makes Void Code an ideal target for embedded AI systems, IoT devices, and mobile platforms running Termux on Android. The language specification presented here covers Version 1.0, including the complete type system, syntax reference, standard library, formal grammar, execution model, and a feasibility analysis for the broader Void Code ecosystem."
    )
  );

  // ========================
  // SECTION 2: Design Philosophy
  // ========================
  children.push(heading1("2. Design Philosophy"));

  children.push(
    bodyText(
      "Void Code rests on four foundational pillars that distinguish it from every existing programming language. These principles are not arbitrary design choices; they are the logical consequences of building a language optimized for AI generation and mathematical expression. Each principle reinforces the others, creating a coherent system where density, precision, and efficiency are not trade-offs but natural allies."
    )
  );

  children.push(heading2("2.1 Math-First Principle"));

  children.push(
    bodyText(
      "The most radical departure from conventional language design is the complete elimination of English keywords. In Void Code, there is no if, no else, no for, no while, no def, no return. Every control structure and operation is expressed using standard mathematical notation. Conditional execution uses Iverson brackets, which return 1 when a condition is true and 0 when false. Iteration uses Sigma and Pi notation for summation and product. Quantifiers from predicate logic (\u2200 and \u2203) replace for-each loops and search operations."
    )
  );
  children.push(
    bodyText(
      "This design choice is not merely aesthetic. Mathematical notation has been refined over centuries to express complex ideas with maximum clarity and minimum ambiguity. When an LLM is trained on millions of mathematical papers, textbooks, and proofs, it internalizes these symbols deeply. By using the same symbols as programming tokens, Void Code creates a direct bridge between the mathematical knowledge encoded in AI models and executable programs. A model that understands \u03A3 notation does not need to learn a separate for-loop syntax; it simply translates its existing knowledge into code."
    )
  );
  children.push(
    bodyText(
      "Consider how a simple conditional assignment works across paradigms. In Python, one might write a five-line if/else block. In Void Code, the same logic becomes a single mathematical expression using Iverson brackets: result \u2190 [x > 0] \u00D7 f(x) + [x \u2264 0] \u00D7 g(x). This is not just shorter; it is mathematically rigorous. The brackets make explicit that the condition produces a numeric value (0 or 1), which multiplies through the expression. There is no hidden branching, no stack manipulation, no scope creation. The mapping from notation to computation is transparent."
    )
  );

  children.push(heading2("2.2 Density Principle"));

  children.push(
    bodyText(
      "Void Code is designed for extreme information density. A single line of Void Code routinely replaces 30 to 50 lines of equivalent Python, or 10 to 15 lines of Julia. This density is not achieved through obfuscation or operator overloading; it is the natural result of using mathematical notation that packs multiple operations into a single expression. Consider computing the sum of squares of even numbers from 1 to 100. In Python, this requires a loop, a condition, and an accumulator. In Void Code, it is a single set-builder expression: result \u2190 \u03A3{x\u00B2 : x \u2208 [1..100], [x mod 2 = 0]}. The set builder combines filtering (the condition after the comma) and transformation (x\u00B2) in one construct, while the Sigma operator provides the summation."
    )
  );

  // Density comparison table
  children.push(
    makeTable(
      ["Task", "Python (LOC)", "Void Code (LOC)", "Compression Ratio"],
      [
        ["Sum of squares", "5", "1", "5:1"],
        ["Matrix multiplication", "12", "1", "12:1"],
        ["Eigenvalue computation", "25", "1", "25:1"],
        ["Conditional branching", "5", "1", "5:1"],
        ["File I/O with processing", "15", "3", "5:1"],
        ["Statistical analysis", "20", "4", "5:1"],
        ["Neural network layer", "30", "2", "15:1"],
      ]
    )
  );
  children.push(spacer(100));

  children.push(
    bodyText(
      "The practical benefit of this density extends beyond readability. Fewer lines of code mean fewer opportunities for bugs, faster compilation, smaller bytecode, and reduced memory footprint. For AI-generated code, density means the generation model can produce complete, complex programs within its output token limit. A task that would require a 2000-token Python response might need only 100 tokens of Void Code, leaving more capacity for the model to reason about correctness and optimization."
    )
  );

  children.push(heading2("2.3 AI-Native Principle"));

  children.push(
    bodyText(
      "Every design decision in Void Code prioritizes machine generation over human authoring. This does not mean humans cannot read or write Void Code; it means that the language's primary consumer is expected to be an AI system. Unicode mathematical symbols serve as tokens that align naturally with the tokenization strategies used by modern LLMs. A transformer model trained on mathematical text already treats \u03A3, \u2202, and \u2200 as semantically meaningful units. Void Code leverages this existing knowledge rather than forcing the model to learn arbitrary keywords like 'for' or 'lambda'."
    )
  );
  children.push(
    bodyText(
      "The language's syntax is designed to minimize the search space during code generation. With no keyword variations (there is only one way to write a summation), the probability that an AI model produces syntactically valid Void Code is inherently higher than for languages with multiple equivalent constructs. The Iverson bracket paradigm eliminates entire classes of syntactic ambiguity. There is no debate about brace placement, indentation style, or semicolon usage, because Void Code uses none of these. Whitespace serves purely as a visual separator; the parser is entirely whitespace-agnostic beyond token boundaries."
    )
  );
  children.push(
    bodyText(
      "Looking forward, the AI-Native Principle extends to the planned AI Compiler, a lightweight 100MB transformer model fine-tuned to translate natural language descriptions directly into Void Code. Because Void Code's syntax is already close to mathematical English, the translation task is dramatically simpler than compiling English to Python or C++. Early feasibility analysis suggests that 85\u201392% accuracy on common programming tasks is achievable with a training corpus of just 50,000 natural language\u2013to\u2013Void Code pairs."
    )
  );

  children.push(heading2("2.4 Resource Efficiency"));

  children.push(
    bodyText(
      "Void Code is engineered to run on devices with as little as 2GB of RAM, making it suitable for deployment on budget Android phones, Raspberry Pi-class single-board computers, and embedded systems. The language achieves this through several architectural decisions. First, all values are stored as fixed-size 64-bit slots, whether they represent integers, floating-point numbers, or references. This uniform representation simplifies the memory allocator and eliminates the need for tagged unions or boxed values. Second, the execution model is stack-based, meaning there is no register allocation pass in the compiler. Bytecode instructions operate directly on a value stack, and the stack pointer is the only state the VM must maintain."
    )
  );
  children.push(
    bodyText(
      "Garbage collection is eliminated entirely. Instead, Void Code uses a region-based memory management scheme where each function invocation creates a memory region that is freed in its entirety when the function returns. This approach is particularly well-suited to the functional style encouraged by Void Code's lambda calculus and set-builder expressions, where most allocations are short-lived. Long-lived data (matrices, large datasets) can be explicitly allocated in a persistent heap region. The total memory footprint of the VM, including the bytecode interpreter, value stack, and heap, is designed to fit within 512MB, leaving 1.5GB for user data and the operating system on a 2GB device."
    )
  );

  // ========================
  // SECTION 3: Type System
  // ========================
  children.push(heading1("3. Type System"));

  children.push(
    bodyText(
      "Void Code's type system is derived directly from mathematical domains rather than computer science categories. Where traditional languages distinguish between int, float, double, and decimal, Void Code recognizes the mathematical sets from which numbers are drawn: \u2124 for integers, \u211D for reals, and \u2102 for complex numbers. This approach is not merely cosmetic; it carries genuine semantic weight. A value declared as type \u2124 participates in integer arithmetic with exact precision, while a value declared as type \u211D uses IEEE 754 double-precision floating-point representation. The type system guides both the compiler's optimization passes and the programmer's (or AI's) intent."
    )
  );
  children.push(
    bodyText(
      "All types use Unicode symbols that are standard in mathematical literature. This means that anyone with a background in university-level mathematics can read Void Code type annotations without learning new notation. The Void type (\u2205) represents the empty set and serves as the null or undefined equivalent, though its use is discouraged in favor of explicit option types. The Boolean type (\uD835\uDD39) is the two-element set {0, 1}, reflecting the Iverson bracket convention where true is 1 and false is 0, rather than separate boolean objects."
    )
  );

  children.push(spacer(60));
  children.push(
    makeTable(
      ["Symbol", "Name", "Domain", "Description"],
      [
        ["\u2205", "Void", "\u2205", "The empty set; null/undefined equivalent"],
        ["\uD835\uDD39", "Boolean", "{0, 1}", "Truth values using Iverson convention"],
        ["\u2124", "Integer", "\u2026, \u22122, \u22121, 0, 1, 2, \u2026", "All integers, arbitrary precision"],
        ["\u211D", "Real", "\u211D", "Real numbers, 64-bit IEEE 754 float"],
        ["\u2102", "Complex", "a + bi", "Complex numbers with real and imaginary parts"],
        ["\uD835\uDD4A", "String", "\u03A3*", "Character sequences and text data"],
        ["\uD835\uDD4C", "Matrix", "\u211D^(m\u00D7n)", "2D numerical arrays, linear algebra native"],
        ["\uD835\uDD4B", "Vector", "\u211D^n", "1D numerical arrays, tensor building blocks"],
        ["\uD835\uDD5C", "Universal", "any", "Dynamic/any type with inference"],
        ["\u2119", "Probability", "\u0394(\u03A9)", "Probability distributions"],
      ]
    )
  );
  children.push(spacer(100));

  children.push(
    bodyText(
      "Type inference in Void Code follows the Hindley-Milner discipline adapted for mathematical types. When a variable is declared without an explicit type annotation, the compiler infers the most specific mathematical type from the initialization expression. For example, the expression x \u2190 5 is inferred as type \u2124 (Integer), while x \u2190 3.14 is inferred as type \u211D (Real). The expression x \u2190 {1, 2, 3} is inferred as a set of integers. When multiple types are possible, the compiler chooses the most general type that preserves type safety."
    )
  );
  children.push(
    bodyText(
      "Casting between types uses explicit mathematical notation. To convert a real number to an integer, one writes x: \u2124 \u2190 \u230A r \u230B (floor function) or x: \u2124 \u2190 trunc(r) (truncation). To convert a set to a vector, one writes v: \uD835\uDD4B \u2190 vec(S). The type system also supports parametric types: a matrix of reals is \uD835\uDD4C<\u211D>, while a matrix of integers is \uD835\uDD4C<\u2124>. Under the hood, all values occupy a fixed 64-bit slot. Integers that exceed the 64-bit range are promoted to arbitrary-precision representations stored on the heap, but this is transparent to the programmer."
    )
  );

  // ========================
  // SECTION 4: Syntax Reference
  // ========================
  children.push(heading1("4. Syntax Reference"));
  children.push(
    bodyText(
      "This section provides the complete syntax reference for Void Code Version 1.0. Every construct is presented with its mathematical motivation, formal syntax, and practical examples. The syntax is designed to be unambiguous: each expression has exactly one valid parse, and each operation maps to exactly one bytecode sequence. This determinism is critical for AI code generation, as it eliminates the possibility of syntactic misinterpretation."
    )
  );

  // 4.1 Assignment
  children.push(heading2("4.1 Assignment & Variables"));
  children.push(
    bodyText(
      "Assignment in Void Code uses the left arrow operator (\u2190), which is standard mathematical notation for definition and assignment. The arrow points from the expression on the right to the variable name on the left, visually reinforcing the direction of data flow. Variables are immutable by default; reassignment requires an explicit mut keyword (borrowed from Rust's philosophy). Constants use the const keyword and must be initialized with a compile-time evaluable expression."
    )
  );
  children.push(
    codeBlock([
      "x \u2190 5                         // basic assignment",
      "x: \u211D = 3.14                   // typed assignment (real number)",
      "mut counter: \u2124 = 0            // mutable integer variable",
      "(x, y, z) \u2190 (1, 2, 3)        // tuple destructuring",
      "const \u03C0 = 3.14159265          // constant declaration",
      "const e = lim_{n\u2192\u221E} (1 + 1/n)^n  // constant from limit",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "Type annotations are optional when the type can be inferred. The compiler performs type inference at compile time and inserts appropriate conversion instructions in the bytecode. When a type annotation is provided, it serves as both documentation and a compile-time constraint. If the inferred type does not match the declared type, the compiler issues a warning and inserts an explicit cast instruction. Tuple destructuring allows multiple variables to be assigned simultaneously from a tuple or vector expression, which is particularly useful for function returns with multiple values."
    )
  );

  // 4.2 Arithmetic
  children.push(heading2("4.2 Arithmetic Operators"));
  children.push(
    bodyText(
      "Void Code uses standard mathematical operators for arithmetic, replacing the ASCII approximations found in most programming languages with their proper Unicode symbols. The multiplication sign (\u00D7) replaces the asterisk, the division sign (\u00F7) replaces the slash, and the minus sign (\u2212) replaces the hyphen. These are not merely cosmetic changes; they eliminate parser ambiguity (the hyphen-minus in ASCII serves double duty as subtraction and negation) and align the language with mathematical convention."
    )
  );
  children.push(
    codeBlock([
      "// Basic operators",
      "+  \u2212  \u00D7  \u00F7  mod  ^  \u221A  |\u00B7|  !",
      "",
      "// Compound expression",
      "result \u2190 (x^2 + y^2) / \u221A(2)",
      "",
      "// Trigonometric computation",
      "angle \u2190 arctan(y / x)",
      "",
      "// Factorial and absolute value",
      "n!  \u2192  n factorial",
      "|x| \u2192  absolute value of x",
      "",
      "// Root extraction",
      "y \u2190 \u221A(x)       // square root",
      "z \u2190 \u221B(x)       // cube root",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "Operator precedence follows standard mathematical conventions: exponentiation (^) binds tightest, followed by unary negation and roots (\u221A), then multiplication and division (\u00D7, \u00F7, mod), then addition and subtraction (+, \u2212). Parentheses can override the default precedence. The modulo operator uses the mathematical definition where the result has the same sign as the dividend, consistent with the behavior expected by mathematicians and distinct from the remainder operator found in some languages."
    )
  );

  // 4.3 Comparison & Logical
  children.push(heading2("4.3 Comparison & Logical Operators"));
  children.push(
    bodyText(
      "Comparison operators in Void Code use proper mathematical symbols rather than ASCII approximations. The not-equal sign (\u2260) replaces !=, the less-than-or-equal sign (\u2264) replaces <=, and the greater-than-or-equal sign (\u2265) replaces >=. Logical operators draw from propositional and predicate logic: conjunction (\u2227), disjunction (\u2228), negation (\u00AC), exclusive or (\u2295), implication (\u2192), and biconditional (\u2194)."
    )
  );
  children.push(
    codeBlock([
      "// Comparison operators",
      "=   \u2260   <   >   \u2264   \u2265",
      "",
      "// Logical operators",
      "\u2227  (AND)     x \u2227 y       // both true",
      "\u2228  (OR)      x \u2228 y       // at least one true",
      "\u00AC  (NOT)     \u00ACx           // negation",
      "\u2295  (XOR)     x \u2295 y       // exclusive or",
      "\u2192  (implies)  P \u2192 Q      // material implication",
      "\u2194  (iff)      P \u2194 Q      // biconditional",
      "",
      "// Combined expression",
      "valid \u2190 [x > 0] \u2227 [y \u2264 10] \u2228 [\u00ACflag]",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "Note that all comparison and logical operators in Void Code return numeric values (0 or 1), consistent with the Iverson bracket convention. This means they can be used directly in arithmetic expressions without any conversion. The expression [x > 0] \u00D7 x + [x \u2264 0] \u00D7 (\u2212x) computes the absolute value of x without any branching, which maps directly to conditional move instructions in the VM bytecode."
    )
  );

  // 4.4 Set Theory
  children.push(heading2("4.4 Set Theory Operations"));
  children.push(
    bodyText(
      "Set theory is not an add-on library in Void Code; it is a first-class citizen of the language syntax. This reflects the foundational role of set theory in modern mathematics and provides a powerful, declarative way to express collections, filtering, and membership testing. Set operations use standard mathematical symbols and are evaluated lazily when possible, enabling efficient processing of large or infinite sets through generator patterns."
    )
  );
  children.push(
    codeBlock([
      "// Membership testing",
      "x \u2208 S           // x is an element of S",
      "x \u2209 S           // x is not an element of S",
      "",
      "// Set operations",
      "S \u222A T           // union of S and T",
      "S \u2229 T           // intersection of S and T",
      "S \\ T            // set difference (elements in S not in T)",
      "S \u25B3 T           // symmetric difference",
      "S \u2282 T           // S is a proper subset of T",
      "S \u2286 T           // S is a subset of T",
      "",
      "// Cardinality and power set",
      "|S|              // cardinality (number of elements)",
      "\u2119(S)            // power set of S",
      "",
      "// Set literal",
      "S = {1, 2, 3, 4, 5}",
      "",
      "// Set builder (filter + transform)",
      "evens \u2190 {x : x \u2208 [1..100], [x mod 2 = 0]}",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "The set builder notation {expression : variable \u2208 range, filter} is one of the most powerful constructs in Void Code. It combines the functionality of map, filter, and list comprehension from functional programming languages into a single mathematical notation. The range can be any enumerable collection, including explicit sets, numeric ranges, or the result of other expressions. The filter uses an Iverson bracket, which evaluates to 0 or 1, naturally excluding elements that do not satisfy the predicate. Set builder expressions can be nested, enabling complex data transformations in a single expression."
    )
  );

  // 4.5 Linear Algebra
  children.push(heading2("4.5 Linear Algebra"));
  children.push(
    bodyText(
      "Linear algebra operations are built into the Void Code syntax with dedicated operators and function calls. This eliminates the need for external libraries like NumPy and ensures that matrix operations are first-class language constructs. The syntax uses standard linear algebra notation: transpose uses the superscript T, matrix multiplication uses the dot operator (\u00B7), and the determinant, trace, and inverse have dedicated function names that mirror their mathematical notation."
    )
  );
  children.push(
    codeBlock([
      "// Matrix literals",
      "A \u2190 [[1, 2], [3, 4]]           // 2\u00D72 matrix",
      "v \u2190 [1, 2, 3, 4]               // column vector",
      "",
      "// Core operations",
      "A^T                // transpose",
      "det(A)             // determinant",
      "tr(A)              // trace (sum of diagonal)",
      "A\u207B\u00B9                // matrix inverse",
      "A \u2297 B            // Kronecker product",
      "A \u00B7 B            // matrix multiplication",
      "A + B              // element-wise addition",
      "A \u00D7 B              // scalar or element-wise multiplication",
      "",
      "// Vector operations",
      "\u2016v\u2016               // Euclidean norm (L2)",
      "v \u00D7 w            // cross product (3D only)",
      "v \u00B7 w            // dot product",
      "",
      "// Decompositions",
      "eigs \u2190 eigen(A)             // eigenvalues and eigenvectors",
      "(U, \u03A3, V) \u2190 svd(A)     // singular value decomposition",
      "(Q, R) \u2190 qr(A)             // QR decomposition",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "Matrix literals use nested square brackets, where each inner list represents a row. The language automatically infers dimensions and validates consistency (all rows must have the same length). Matrix operations are optimized in the VM bytecode: matrix multiplication generates calls to a BLAS-like kernel, and operations like transpose are performed in-place when the source matrix is not aliased. The language supports sparse matrices through a special Sparse<\u211D> type that stores only non-zero elements in compressed sparse row (CSR) format."
    )
  );

  // 4.6 Calculus
  children.push(heading2("4.6 Calculus Notation"));
  children.push(
    bodyText(
      "Void Code is the first programming language to embed calculus notation directly into its syntax. Summation (\u03A3), product (\u03A0), integration (\u222B), differentiation (\u2202), and limits (lim) are all first-class constructs with dedicated parsing rules. These are not function calls; they are syntactic forms with their own binding rules for index variables and bounds. The summation and product operators support both explicit bounds (\u03A3_{i=1}^{n}) and implicit bounds over sets (\u03A3_{x \u2208 S})."
    )
  );
  children.push(
    codeBlock([
      "// Summation and product",
      "\u03A3_{i=1}^{n} i^2                   // sum of squares from 1 to n",
      "\u03A0_{i=1}^{n} i                    // product from 1 to n (factorial when n>=1)",
      "\u03A3_{x \u2208 S} f(x)               // sum over set elements",
      "",
      "// Integration",
      "\u222B_0^1 x^2 dx                    // definite integral",
      "\u222B_0^\u221E e^(\u2212x) dx            // improper integral",
      "",
      "// Differentiation",
      "\u2202f/\u2202x                          // partial derivative",
      "\u2202\u00B2f/\u2202x\u00B2                        // second partial derivative",
      "\u2207f                              // gradient vector",
      "",
      "// Limits",
      "lim_{x\u2192\u221E} f(x)                  // limit at infinity",
      "lim_{x\u21920} sin(x)/x              // limit approaching zero",
      "",
      "// Practical usage",
      "area \u2190 \u222B_a^b f(x) dx              // compute area under curve",
      "total \u2190 \u03A3_{i=0}^{n-1} a[i] \u00D7 w[i]  // weighted sum",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "In the VM, definite integrals are computed using adaptive Simpson's quadrature with a configurable tolerance. Derivatives use automatic differentiation (forward mode) for exact computation, not finite differences. This means that expressions like \u2202f/\u2202x produce exact derivatives up to machine precision, making Void Code suitable for scientific computing, optimization, and physics simulations. The gradient operator (\u2207) automatically computes partial derivatives with respect to all free variables, returning a vector of partial derivatives."
    )
  );

  // 4.7 Iverson Brackets
  children.push(heading2("4.7 Control Flow: Iverson Brackets"));
  children.push(
    bodyText(
      "The Iverson bracket, denoted [condition], is the foundational control flow mechanism in Void Code. Named after the mathematician Kenneth E. Iverson (who also created APL), this construct returns 1 if the enclosed condition is true and 0 if it is false. It replaces all traditional conditional constructs: if/else, switch/case, and ternary operators. The beauty of the Iverson bracket is that it transforms conditional logic into arithmetic, which can then be composed using standard mathematical operations."
    )
  );
  children.push(
    codeBlock([
      "// Conditional assignment (replaces if/else)",
      "result \u2190 [x > 0] \u00D7 f(x) + [x \u2264 0] \u00D7 g(x)",
      "",
      "// Absolute value using Iverson brackets",
      "y \u2190 [x \u2265 0] \u00D7 x + [x < 0] \u00D7 (\u2212x)",
      "",
      "// Kronecker delta",
      "\u03B4_{i,j} = [i = j]",
      "",
      "// Piecewise function",
      "f(x) = [x < 0] \u00D7 0 + [0 \u2264 x < 1] \u00D7 x^2 + [x \u2265 1] \u00D7 1",
      "",
      "// Guard clause in function",
      "safe_div(a, b) = a / b, \u2200[b \u2260 0]",
      "",
      "// Multi-way conditional",
      "sign \u2190 [x > 0] \u00D7 1 + [x = 0] \u00D7 0 + [x < 0] \u00D7 (\u22121)",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "The Iverson bracket integrates seamlessly with mathematical expressions because it produces a numeric value rather than a separate boolean type. This means that conditional logic can be embedded directly into formulas without breaking the expression. For example, computing the number of elements in a set that satisfy a condition is simply \u03A3_{x \u2208 S} [condition(x)]. There is no need for a separate filter-then-count pattern. The VM optimizes chains of Iverson brackets into conditional select instructions, avoiding unnecessary multiplications by zero."
    )
  );

  // 4.8 Iteration
  children.push(heading2("4.8 Iteration: Mathematical Notation"));
  children.push(
    bodyText(
      "Void Code replaces traditional loop constructs with mathematical iteration notation. The summation operator (\u03A3) serves as the primary looping construct for accumulation tasks. The product operator (\u03A0) handles multiplicative accumulation. Set builder notation provides map-filter functionality. And quantifiers from predicate logic (\u2200 for universal, \u2203 for existential) handle iteration with side effects. Each of these constructs is more expressive than a traditional loop because they declare what to compute, not how to compute it."
    )
  );
  children.push(
    codeBlock([
      "// Summation as loop (replaces for loop)",
      "sum \u2190 \u03A3_{i=0}^{n} a[i]",
      "",
      "// Product loop (factorial example)",
      "fact \u2190 \u03A0_{i=1}^{n} i",
      "",
      "// Set builder: map + filter",
      "evens \u2190 {x^2 : x \u2208 [1..10], [x mod 2 = 0]}",
      "",
      "// Universal quantifier: apply to all elements",
      "\u2200x \u2208 S \u2192 f(x)              // apply f to every element",
      "",
      "// Existential quantifier: find first match",
      "result \u2190 \u2203x \u2208 S : [x > threshold] \u00D7 x",
      "",
      "// Nested iteration",
      "matrix_sum \u2190 \u03A3_{i=1}^{m} \u03A3_{j=1}^{n} A[i][j]",
      "",
      "// Range-based iteration",
      "squares \u2190 {i^2 : i \u2208 [1..100]}",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "The VM can evaluate iteration constructs in parallel when the iterations are independent. Summation and product over ranges are automatically parallelized using a divide-and-conquer strategy: the range is split into chunks, each chunk is processed by a virtual thread, and the partial results are combined. Set builder notation is evaluated using a pipeline: elements are generated, filtered, and transformed in a streaming fashion. This lazy evaluation strategy means that infinite ranges (like [1..\u221E]) can be used with appropriate terminating conditions."
    )
  );

  // 4.9 Functions
  children.push(heading2("4.9 Functions: Lambda & Mapping"));
  children.push(
    bodyText(
      "Functions in Void Code are first-class values defined using lambda calculus notation. The lambda expression \u03BBx. body defines an anonymous function with parameter x and body expression. Named functions use an equals sign for definition: f(x) = body. Functions can be recursive, higher-order (taking functions as arguments or returning functions), and composed using the circle operator (\u2218). The language supports currying: a function of two parameters can be partially applied to produce a function of one parameter."
    )
  );
  children.push(
    codeBlock([
      "// Lambda calculus",
      "f \u2190 \u03BBx. x^2 + 2x + 1",
      "",
      "// Mapping notation with typed signature",
      "g: \u211D\u00D7\u211D \u21A6 \u211D = \u03BB(x, y). \u221A(x^2 + y^2)",
      "",
      "// Recursive definition",
      "fact(0) = 1",
      "fact(n) = n \u00D7 fact(n\u22121), \u2200n > 0",
      "",
      "// Function composition",
      "h \u2190 f \u2218 g                 // h(x) = f(g(x))",
      "",
      "// Higher-order function",
      "apply \u2190 \u03BB(f, x). f(x)",
      "result \u2190 apply(sin, \u03C0/2)   // returns 1",
      "",
      "// Currying and partial application",
      "add \u2190 \u03BB(a, b). a + b",
      "add5 \u2190 add(5)                // partially applied, returns \u03BBb. 5 + b",
      "",
      "// Function with constraint guard",
      "safe_div(a, b) = a / b, \u2200[b \u2260 0]",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "Recursive functions in Void Code use pattern-matching syntax: multiple definitions of the same function with different argument patterns. The compiler matches arguments top-to-bottom and generates dispatch code accordingly. Tail-recursive functions are automatically optimized to loop form by the compiler, preventing stack overflow for recursive computations over large datasets. The language supports mutual recursion, where two or more functions call each other, through a forward declaration mechanism."
    )
  );

  // 4.10 I/O
  children.push(heading2("4.10 I/O Operations"));
  children.push(
    bodyText(
      "Input/output in Void Code uses a minimal, symmetric syntax based on arrow direction. The right arrow (\u2192) sends data to an output destination (stdout by default, or a file path). The left arrow (\u2190) receives data from an input source. When \u2190 is used in an assignment context with a string literal on the right side, it reads from a file or prompts for input. This creates a clean, visual distinction between data flowing into and out of the program."
    )
  );
  children.push(
    codeBlock([
      "// Output to stdout",
      "\u2192 \"Hello, World!\"",
      "\u2192 x                             // print variable value",
      "\u2192 (x, y, z)                    // print tuple",
      "",
      "// Formatted output",
      "\u2192 f\"Value: {x:.2f}\"             // f-string formatting",
      "",
      "// Read from stdin",
      "input \u2190 \u2190 \"Enter name: \"",
      "",
      "// File I/O",
      "data \u2190 \u2190 \"data.csv\"            // read file contents",
      "\u2192 (processed, \"output.csv\")   // write to file",
      "",
      "// Structured data",
      "records \u2190 \u2190 json(\"data.json\")  // parse JSON",
      "\u2192 json(records, \"out.json\")    // write JSON",
      "",
      "// Network",
      "response \u2190 \u2190 http_get(\"https://api.example.com/data\")",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "The I/O system is designed to be non-blocking by default. File reads return immediately with a promise-like handle that can be composed with other operations. The language includes built-in support for CSV, JSON, and plain text formats. The \u2192 operator is overloaded based on the type of its right operand: a string literal writes to a file, while no right operand (or a parenthesized expression) writes to stdout. Error handling follows the mathematical convention: operations that fail produce \u2205 (void), and the programmer can use Iverson brackets to check for success: result \u2190 file_data; [\u2208 result] \u00D7 process(result)."
    )
  );

  // ========================
  // SECTION 5: Complete Code Examples
  // ========================
  children.push(heading1("5. Complete Code Examples"));
  children.push(
    bodyText(
      "This section presents complete, working Void Code programs that demonstrate the language's capabilities across a range of domains. Each example is self-contained and illustrates how Void Code's mathematical syntax produces clean, expressive programs. The examples progress from trivial to advanced, showcasing the language's scalability."
    )
  );

  children.push(heading2("5.1 Hello World"));
  children.push(
    bodyText(
      "The canonical first program in any language demonstrates the minimal syntax required to produce output. In Void Code, the Hello World program consists of a single operator and a single string literal. The right arrow (\u2192) is the output operator, and the string \"Hello, World!\" is the data to output. There is no main function, no class declaration, no import statement, and no semicolon. The entire program is one token of syntax and one token of data."
    )
  );
  children.push(codeBlock(['\u2192 "Hello, World!"']));
  children.push(spacer(60));
  children.push(
    bodyText(
      "This extreme minimality is by design. In Python, Hello World requires a function call: print(\"Hello, World!\"). In C, it requires #include <stdio.h>, a main function, a printf call, and a return statement. In Void Code, the output operator is a fundamental language primitive, not a library function. It maps directly to a single VM instruction: OUTPUT. The simplicity of this program reflects the language's philosophy that common operations should require minimal ceremony."
    )
  );

  children.push(heading2("5.2 Fibonacci Sequence"));
  children.push(
    bodyText(
      "The Fibonacci sequence is a classic example that tests a language's ability to handle recursion, pattern matching, and collection generation. Void Code's mathematical syntax makes the recursive definition read exactly like the mathematical definition. The pattern-matching syntax fib(0) = 0; fib(1) = 1; fib(n) = ... mirrors how the sequence is defined in textbooks."
    )
  );
  children.push(
    codeBlock([
      "// Recursive definition (pattern matching)",
      "fib(0) = 0",
      "fib(1) = 1",
      "fib(n) = fib(n\u22121) + fib(n\u22122), \u2200n \u2265 2",
      "",
      "// Generate first 20 Fibonacci numbers",
      "sequence \u2190 [fib(i) : i \u2208 [0..19]]",
      "\u2192 sequence",
      "",
      "// Compute nth Fibonacci using closed form (Binet's formula)",
      "fib_n \u2190 (\u03C6^n \u2212 \u03C8^n) / \u221A5,  \u03C6 = (1+\u221A5)/2,  \u03C8 = (1\u2212\u221A5)/2",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "The first definition uses pattern matching, which the compiler transforms into a dispatch table. The second definition uses the set builder to generate a list of Fibonacci numbers, and the third shows that mathematical formulas can be used directly in code. The golden ratio \u03C6 is defined inline using a const expression, demonstrating Void Code's support for mathematical constants within executable code."
    )
  );

  children.push(heading2("5.3 Matrix Operations"));
  children.push(
    bodyText(
      "Linear algebra is a core strength of Void Code. Matrix operations that would require importing NumPy in Python or writing manual loops in most languages are expressible in a single line. This example demonstrates matrix creation, arithmetic operations, and eigenvalue computation."
    )
  );
  children.push(
    codeBlock([
      "// Define matrices",
      "A \u2190 [[1, 2], [3, 4]]",
      "B \u2190 [[5, 6], [7, 8]]",
      "",
      "// Matrix arithmetic",
      "C \u2190 A \u00B7 B              // matrix multiplication",
      "D \u2190 A + B              // element-wise addition",
      "E \u2190 A \u2212 B              // element-wise subtraction",
      "",
      "// Properties",
      "det_A \u2190 det(A)         // determinant = -2",
      "trace_A \u2190 tr(A)       // trace = 5",
      "A_inv \u2190 A\u207B\u00B9           // inverse matrix",
      "",
      "// Decompositions",
      "eigs \u2190 eigen(A)         // eigenvalues: {-0.372, 5.372}",
      "(Q, R) \u2190 qr(A)         // QR decomposition",
      "",
      "// Verification: A * A_inv = I",
      "\u2190 A \u00B7 A_inv            // should print identity matrix",
    ])
  );
  children.push(spacer(60));

  children.push(heading2("5.4 Statistical Analysis"));
  children.push(
    bodyText(
      "Data analysis is a primary use case for Void Code. This example reads sensor data from a CSV file, computes basic statistics, identifies outliers using the three-sigma rule, and reports the results. The entire analysis, which would require dozens of lines in Python with pandas, fits in four lines of Void Code."
    )
  );
  children.push(
    codeBlock([
      "// Load data from CSV",
      "data \u2190 \u2190 \"sensor_readings.csv\"",
      "",
      "// Compute statistics",
      "\u03BC \u2190 mean(data)             // arithmetic mean",
      "\u03C3 \u2190 stddev(data)            // standard deviation",
      "median_val \u2190 median(data)  // median",
      "",
      "// Identify outliers (3-sigma rule)",
      "outliers \u2190 {x : x \u2208 data, [|x \u2212 \u03BC| > 3\u03C3]}",
      "",
      "// Report",
      "\u2192 f\"Mean: {\u03BC:.3f}, StdDev: {\u03C3:.3f}\"",
      "\u2192 f\"Outliers: |outliers| = {|outliers|}\"",
      "\u2192 outliers",
    ])
  );
  children.push(spacer(60));

  children.push(heading2("5.5 Neural Network Forward Pass"));
  children.push(
    bodyText(
      "This example demonstrates Void Code's suitability for implementing machine learning algorithms. A three-layer neural network forward pass, including the sigmoid activation function, matrix multiplications, and mean squared error loss, is expressed in just a few lines. The mathematical notation makes the relationship between the code and the underlying mathematics immediately apparent."
    )
  );
  children.push(
    codeBlock([
      "// Sigmoid activation function",
      "\u03C3 \u2190 \u03BBz. 1 / (1 + e^(\u2212z))",
      "",
      "// Single neuron: y = \u03C3(w\u00B7x + b)",
      "neuron \u2190 \u03BB(w, x, b). \u03C3(w \u00B7 x + b)",
      "",
      "// Fully connected layer: Y = \u03C3(X \u00B7 W^T + b)",
      "layer \u2190 \u03BB(W, X, b). \u03C3(X \u00B7 W^T + b)",
      "",
      "// 3-layer network forward pass",
      "y\u0302 \u2190 layer(W\u2083, layer(W\u2082, layer(W\u2081, X, b\u2081), b\u2082), b\u2083)",
      "",
      "// Mean squared error loss",
      "loss \u2190 \u03A3(y \u2212 y\u0302)^2 / |y|",
      "",
      "// Backpropagation (gradient via auto-diff)",
      "\u2207loss \u2190 gradient(loss, [W\u2081, W\u2082, W\u2083])",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "The forward pass composition layer(W\u2083, layer(W\u2082, layer(W\u2081, X, b\u2081), b\u2082), b\u2083) illustrates how function composition works naturally in Void Code. The gradient operator (\u2207) uses automatic differentiation to compute the gradient of the loss with respect to all three weight matrices simultaneously, enabling gradient descent optimization."
    )
  );

  children.push(heading2("5.6 File System Operations"));
  children.push(
    codeBlock([
      "// List directory contents",
      "files \u2190 ls(\"src/\")",
      "",
      "// Filter for .void source files",
      "void_files \u2190 {f : f \u2208 files, [f \u2208 *.void]}",
      "",
      "// Process each file: read, measure, hash",
      "\u2200f \u2208 void_files \u2192 (",
      "  content \u2190 \u2190 f",
      "  \u2192 (f, |content|, hash(content))",
      ")",
      "",
      "// Create output directory and write summary",
      "mkdir(\"build/\")",
      "summary \u2190 {(|content|, f) : f \u2208 void_files, content \u2190 \u2190 f}",
      "\u2192 (summary, \"build/summary.csv\")",
    ])
  );
  children.push(spacer(60));
  children.push(
    bodyText(
      "This example demonstrates Void Code's file system integration, combining directory listing, filtering, file I/O, and batch processing. The universal quantifier (\u2200) applies a block of operations to each element in the set of .void files. The hash function computes a SHA-256 digest of the file contents, and the results are collected into a summary table written to CSV format."
    )
  );

  // ========================
  // SECTION 6: Formal Grammar
  // ========================
  children.push(heading1("6. Formal Grammar Specification"));
  children.push(
    bodyText(
      "The formal grammar of Void Code is presented here in Extended Backus-Naur Form (EBNF). This grammar is the authoritative specification of Void Code's syntax; any program that can be derived from this grammar is syntactically valid Void Code. The grammar is designed to be unambiguous: every valid program has exactly one parse tree. The lexer and parser are generated directly from this grammar specification."
    )
  );

  children.push(heading2("6.1 Grammar Rules"));
  children.push(
    codeBlock([
      "<program>      ::= <statement_list>",
      "<statement_list>::= { <statement> }",
      "<statement>    ::= <assignment> | <expression_stmt> | <function_def> | <io_stmt>",
      "",
      "<assignment>   ::= <pattern> \"\u2190\" <expression>",
      "<pattern>      ::= <identifier>",
      "                | \"(\" <identifier_list> \")\"",
      "                | <identifier> \":\" <type>",
      "                | \"const\" <identifier> \"=\" <expression>",
      "                | \"mut\" <identifier> \":\" <type> \"=\" <expression>",
      "",
      "<type>         ::= \"\u2205\" | \"\uD835\uDD39\" | \"\u2124\" | \"\u211D\" | \"\u2102\"",
      "                | \"\uD835\uDD4A\" | \"\uD835\uDD4C\" | \"\uD835\uDD4B\" | \"\uD835\uDD5C\" | \"\u2119\"",
      "",
      "<expression>   ::= <term> { (\"+\" | \"\u2212\") <term> }",
      "<term>         ::= <factor> { (\"\u00D7\" | \"\u00F7\" | \"mod\") <factor> }",
      "<factor>       ::= <unary> { \"^\" <unary> }",
      "<unary>        ::= [\"\u2212\" | \"\u00AC\"] <base>",
      "<base>         ::= <number> | <string> | <identifier>",
      "                | <function_call> | <matrix_literal>",
      "                | \"(\" <expression> \")\"",
      "                | \"[\" <condition> \"]\"         // Iverson bracket",
      "                | <set_literal> | <set_builder>",
      "                | <lambda>",
      "",
      "<condition>    ::= <expression> <comparator> <expression>",
      "                | <condition> <logical_op> <condition>",
      "<comparator>   ::= \"=\" | \"\u2260\" | \"<\" | \">\" | \"\u2264\" | \"\u2265\"",
      "<logical_op>   ::= \"\u2227\" | \"\u2228\" | \"\u2295\" | \"\u2192\" | \"\u2194\"",
      "",
      "<function_def> ::= <identifier> \"(\" <params> \")\" \"=\" <expression>",
      "                | <identifier> \"(\" <params> \")\" \"=\" <expression> \",\" \"\u2200\" <constraint>",
      "",
      "<io_stmt>      ::= \"\u2192\" <expression>",
      "                | <identifier> \"\u2190\" \"\u2190\" <source>",
      "",
      "<set_literal>  ::= \"{\" <expression_list> \"}\"",
      "<set_builder>  ::= \"{\" <expression> \":\" <identifier> \"\u2208\" <range>",
      "                | \"{\" <expression> \":\" <identifier> \"\u2208\" <range> \",\" <filter> \"}\"",
      "<range>        ::= \"[\" <expression> \"..\" <expression> \"]\"",
      "",
      "<lambda>       ::= \"\u03BB\" <params> \".\" <expression>",
      "<matrix_literal>::= \"[\" <row_list> \"]\"   // each row is \"[\" <expr_list> \"]\"",
    ])
  );
  children.push(spacer(100));

  children.push(heading2("6.2 Lexer Rules"));
  children.push(
    bodyText(
      "The Void Code lexer is Unicode-aware and tokenizes the source code into a stream of tokens for the parser. Lexer rules are as follows:"
    )
  );
  children.push(
    bodyPara([
      boldRun("Whitespace: "),
      bodyRun("Spaces, tabs, and newlines serve as token separators. There are no significant whitespace rules (no indentation sensitivity, no semicolons). The lexer skips all whitespace between tokens."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Comments: "),
      bodyRun("Single-line comments begin with // and extend to the end of the line. Multi-line comments are delimited by /* and */. Comments are stripped by the lexer and never reach the parser."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Identifiers: "),
      bodyRun("Identifiers begin with a Unicode letter (including Greek letters, subscripts, and superscripts) and may contain letters, digits, underscores, and primes ('). Examples: x, \u03B1, W\u2081, f\u2032, eigen_values."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Numbers: "),
      bodyRun("Numeric literals support integers (42), decimals (3.14), scientific notation (6.022e23), and hexadecimal (0xFF). Complex numbers are written as a+bi where i is the imaginary unit."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Strings: "),
      bodyRun("String literals are delimited by double quotes (\"). Escape sequences use the backslash: \\n, \\t, \\\\, \\\". Raw strings use triple quotes (\"\"\")."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Operators: "),
      bodyRun("All mathematical operators (\u2190, \u00D7, \u00F7, \u2212, \u222A, \u2229, \u2208, \u03A3, \u03A0, \u222B, \u03BB, \u2200, \u2203, \u2227, \u2228, \u00AC, \u2295, \u2192, \u2194, ^, \u221A, \u2202, \u2207) are single-character or two-character tokens recognized directly by the lexer. Subscript and superscript notation (e.g., \u03A3_{i=1}^{n}) is tokenized as a composite operator token."),
    ])
  );
  children.push(
    bodyText(
      "The lexer uses a longest-match strategy with Unicode character categories to correctly identify multi-byte operators. For example, the sequence \u2212> is tokenized as the assignment operator \u2190, not as the minus sign followed by the greater-than sign. The tokenizer maintains a lookup table of all valid operator symbols and their precedence classes."
    )
  );

  // ========================
  // SECTION 7: Standard Library
  // ========================
  children.push(heading1("7. Standard Library"));
  children.push(
    bodyText(
      "The Void Code standard library provides a comprehensive set of mathematical and utility functions organized into logical modules. These functions are always available without import statements, reflecting the language's philosophy that common operations should require zero ceremony. The standard library is implemented in native code within the VM for maximum performance, and all functions are pure (no side effects) unless explicitly documented otherwise."
    )
  );

  children.push(heading2("7.1 Core Mathematics"));
  children.push(
    bodyText(
      "The core mathematics module provides fundamental arithmetic, rounding, and number-theoretic functions. These functions cover the vast majority of numerical computations needed in scientific and engineering applications."
    )
  );
  children.push(
    codeBlock([
      "// Absolute value and roots",
      "abs(x) \u2192 |x|                   // absolute value",
      "sqrt(x) \u2192 \u221Ax                  // square root",
      "cbrt(x) \u2192 \u221Bx                  // cube root",
      "nth_root(x, n) \u2192 \u207F\u221Ax        // nth root",
      "",
      "// Exponentiation and logarithms",
      "pow(base, exp) \u2192 base^exp",
      "exp(x) \u2192 e^x                   // natural exponent",
      "ln(x) \u2192 log_e(x)                // natural log",
      "log2(x) \u2192 log\u2082(x)             // base-2 log",
      "log10(x) \u2192 log\u2081\u2080(x)           // base-10 log",
      "log(x, base) \u2192 log_base(x)       // arbitrary base log",
      "",
      "// Factorial and combinatorics",
      "factorial(n) \u2192 n!",
      "comb(n, k) \u2192 C(n,k)             // binomial coefficient",
      "perm(n, k) \u2192 P(n,k)             // permutations",
      "",
      "// Number theory",
      "gcd(a, b) \u2192 greatest common divisor",
      "lcm(a, b) \u2192 least common multiple",
      "is_prime(n) \u2192 [n is prime]",
      "primes(n) \u2192 {p : p \u2264 n, [is_prime(p)]}",
      "",
      "// Rounding and comparison",
      "round(x), floor(x), ceil(x), trunc(x)",
      "sign(x) \u2192 {\u22121, 0, 1}",
      "min(a, b), max(a, b)",
      "clamp(x, lo, hi) \u2192 max(lo, min(hi, x))",
      "mod(a, b), divmod(a, b)",
    ])
  );
  children.push(spacer(60));

  children.push(heading2("7.2 Trigonometry"));
  children.push(
    bodyText(
      "The trigonometry module provides all standard trigonometric functions, their inverses, hyperbolic variants, and angle conversion utilities. All functions operate in radians by default; use degrees() and radians() for conversion."
    )
  );
  children.push(
    codeBlock([
      "// Standard trig",
      "sin(x), cos(x), tan(x)",
      "csc(x), sec(x), cot(x)",
      "",
      "// Inverse trig",
      "arcsin(x), arccos(x), arctan(x), arctan2(y, x)",
      "",
      "// Hyperbolic",
      "sinh(x), cosh(x), tanh(x)",
      "arcsinh(x), arccosh(x), arctanh(x)",
      "",
      "// Conversions",
      "degrees(x) \u2192 x \u00D7 180/\u03C0",
      "radians(x) \u2192 x \u00D7 \u03C0/180",
      "hypot(a, b) \u2192 \u221A(a\u00B2 + b\u00B2)",
    ])
  );
  children.push(spacer(60));

  children.push(heading2("7.3 Linear Algebra"));
  children.push(
    bodyText(
      "The linear algebra module provides a complete set of matrix and vector operations optimized for performance within the VM. These functions implement BLAS (Basic Linear Algebra Subprograms) level 1, 2, and 3 operations, as well as LAPACK-level decompositions."
    )
  );
  children.push(
    codeBlock([
      "// Basic operations",
      "dot(a, b) \u2192 a \u00B7 b              // dot product",
      "cross(a, b) \u2192 a \u00D7 b            // cross product (3D)",
      "matmul(A, B) \u2192 A \u00B7 B           // matrix multiplication",
      "",
      "// Matrix properties",
      "transpose(M) \u2192 M^T",
      "inverse(M) \u2192 M\u207B\u00B9",
      "det(M) \u2192 determinant",
      "trace(M) \u2192 tr(M)",
      "rank(M) \u2192 matrix rank",
      "norm(v) \u2192 \u2016v\u2016                  // L2 norm",
      "norm_p(v, p) \u2192 Lp norm",
      "",
      "// Decompositions",
      "eigen(M) \u2192 (\u03BB, V)              // eigenvalues, eigenvectors",
      "svd(M) \u2192 (U, \u03A3, V)            // singular value decomposition",
      "qr(M) \u2192 (Q, R)",
      "lu(M) \u2192 (L, U, P)",
      "cholesky(M) \u2192 L                  // for positive-definite M",
      "",
      "// Solvers",
      "solve(A, b) \u2192 x  where Ax = b",
      "lstsq(A, b) \u2192 x  // least squares solution",
    ])
  );
  children.push(spacer(60));

  children.push(heading2("7.4 Statistics & Probability"));
  children.push(
    bodyText(
      "The statistics module provides descriptive statistics, probability distributions, random number generation, and Bayesian inference utilities. These functions operate on sets and vectors, returning single values or distribution objects as appropriate."
    )
  );
  children.push(
    codeBlock([
      "// Descriptive statistics",
      "mean(S), median(S), mode(S)",
      "variance(S), stddev(S)",
      "covariance(X, Y), correlation(X, Y)",
      "percentile(S, p), quartiles(S)",
      "skewness(S), kurtosis(S)",
      "",
      "// Random generation",
      "random() \u2192 U(0,1)               // uniform [0,1)",
      "random_int(a, b) \u2192 \u2124 in [a,b]",
      "random_normal(\u03BC, \u03C3) \u2192 N(\u03BC,\u03C3\u00B2)",
      "shuffle(S) \u2190 randomized copy",
      "",
      "// Distributions",
      "pdf(dist, x) \u2192 P(X=x)",
      "cdf(dist, x) \u2192 P(X\u2264x)",
      "quantile(dist, p) \u2192 x where CDF(x)=p",
      "",
      "// Bayesian inference",
      "bayes(P_H, P_E|H, P_E) \u2192 P(H|E)",
      "likelihood(data, \u03B8) \u2192 L(\u03B8|data)",
    ])
  );
  children.push(spacer(60));

  children.push(heading2("7.5 Calculus"));
  children.push(
    bodyText(
      "The calculus module provides numerical differentiation, integration, and optimization functions. Differentiation uses automatic differentiation (forward and reverse mode) for exact results, while integration uses adaptive quadrature methods. Optimization functions implement gradient descent and Newton's method."
    )
  );
  children.push(
    codeBlock([
      "// Differentiation",
      "derivative(f, x, h) \u2192 \u2202f/\u2202x at x (forward AD)",
      "gradient(f, x_vec) \u2192 \u2207f at x_vec",
      "hessian(f, x_vec) \u2192 \u2202\u00B2f/\u2202x\u1D62\u2202x\u2C7C",
      "",
      "// Integration",
      "integrate(f, a, b) \u2192 \u222B_a^b f(x) dx  (adaptive Simpson)",
      "integrate(f, a, b, n) \u2192 \u222B_a^b f(x) dx  (Simpson with n points)",
      "integrate_2d(f, xa, xb, ya, yb) \u2192 double integral",
      "",
      "// ODE solving",
      "solve_ode(f, y0, t_span) \u2192 solution curve  (RK45)",
      "",
      "// Optimization",
      "minimize(f, x0) \u2192 argmin f(x)   (gradient descent)",
      "maximize(f, x0) \u2192 argmax f(x)   (gradient ascent)",
      "minimize(f, x0, method=\"newton\") \u2192 Newton's method",
    ])
  );
  children.push(spacer(60));

  children.push(heading2("7.6 Set Operations"));
  children.push(
    codeBlock([
      "union(A, B) \u2192 A \u222A B",
      "intersection(A, B) \u2192 A \u2229 B",
      "difference(A, B) \u2192 A \\ B",
      "symmetric_diff(A, B) \u2192 A \u25B3 B",
      "cartesian(A, B) \u2192 A \u00D7 B",
      "power_set(S) \u2192 \u2119(S)",
      "is_subset(A, B) \u2192 [A \u2286 B]",
      "is_superset(A, B) \u2192 [A \u2287 B]",
      "is_disjoint(A, B) \u2192 [|A \u2229 B| = 0]",
    ])
  );
  children.push(spacer(60));

  children.push(heading2("7.7 String Operations"));
  children.push(
    codeBlock([
      "len(s) \u2192 |s|                   // string length",
      "split(s, delim) \u2192 {substrings}",
      "join(S, sep) \u2192 concatenated string",
      "substr(s, start, end) \u2192 substring",
      "regex_match(s, pattern) \u2192 [matches]",
      "regex_replace(s, pattern, replacement)",
      "to_upper(s), to_lower(s)",
      "trim(s) \u2192 whitespace-stripped string",
      "contains(s, sub) \u2192 [sub \u2208 s]",
      "starts_with(s, prefix) \u2192 [s begins with prefix]",
    ])
  );
  children.push(spacer(60));

  children.push(heading2("7.8 I/O & System"));
  children.push(
    codeBlock([
      "// File operations",
      "read_file(path) \u2192 string contents",
      "write_file(path, data) \u2192 success",
      "read_csv(path) \u2192 matrix of strings",
      "write_csv(path, data) \u2192 formatted CSV",
      "read_json(path) \u2192 parsed object",
      "write_json(path, data) \u2192 JSON string",
      "",
      "// Network",
      "http_get(url) \u2192 response string",
      "http_post(url, body) \u2192 response string",
      "",
      "// System",
      "exec(cmd) \u2192 shell command output",
      "ls(path) \u2190 directory listing",
      "cd(path) \u2192 change directory",
      "mkdir(path) \u2192 create directory",
      "rm(path) \u2192 delete file/directory",
      "env(name) \u2190 environment variable",
      "sleep(seconds) \u2192 pause execution",
      "now() \u2190 current Unix timestamp",
      "hash(data) \u2192 SHA-256 hex string",
    ])
  );
  children.push(spacer(60));

  // ========================
  // SECTION 8: Execution Model
  // ========================
  children.push(heading1("8. Execution Model"));
  children.push(
    bodyText(
      "Void Code programs are compiled to bytecode and executed on a lightweight, stack-based virtual machine. This section describes the VM architecture, memory model, bytecode format, and compilation pipeline in detail. The execution model is designed for simplicity and predictability: there is no JIT compilation, no garbage collection, and no runtime optimization passes. The bytecode is the final representation, and the interpreter executes it directly."
    )
  );

  children.push(heading2("8.1 Stack-Based Virtual Machine"));
  children.push(
    bodyText(
      "The Void Code VM is a registerless, stack-based interpreter inspired by the JVM and CPython bytecode interpreters but significantly simpler. All operations consume their operands from the top of the value stack and push their results back onto it. The VM maintains four internal state variables: the instruction pointer (IP), the value stack pointer (SP), the frame pointer (FP), and the heap pointer (HP). There are no general-purpose registers; all intermediate values live on the stack."
    )
  );
  children.push(
    bodyText(
      "The value stack is pre-allocated at VM startup with a fixed size of 64KB entries (512KB of memory at 8 bytes per entry). Each entry is a 64-bit value that can represent an integer, floating-point number, or pointer to heap-allocated data (strings, matrices, sets). The VM uses NaN-boxing to distinguish between these types within a single 64-bit slot: the upper bits of a NaN-pattern floating-point value encode the type tag and pointer offset. This technique, borrowed from JavaScriptCore and LuaJIT, provides fast type dispatch without the overhead of tagged unions."
    )
  );
  children.push(
    bodyText(
      "Function calls create a new stack frame by pushing the current FP and IP onto the call stack. Arguments are passed on the value stack. The VM supports a maximum call depth of 1024 frames, which is sufficient for most recursive algorithms. Tail-call optimization is performed at compile time: when the compiler detects that a function's last action is to call another function (with matching arity), it reuses the current frame instead of creating a new one."
    )
  );

  children.push(heading2("8.2 Memory Layout"));
  children.push(
    bodyText(
      "The VM manages a single contiguous memory region divided into three segments: the code segment, the value stack, and the heap. The total memory budget is 512MB, organized as follows:"
    )
  );
  children.push(
    makeTable(
      ["Segment", "Size", "Purpose"],
      [
        ["Code Segment", "32 MB", "Bytecode storage, read-only after compilation"],
        ["Value Stack", "2 MB", "64K entries \u00D7 64 bits for computation"],
        ["Call Stack", "64 KB", "1024 frames \u00D7 64 bytes each"],
        ["Heap", "~478 MB", "Strings, matrices, sets, and dynamic allocations"],
      ]
    )
  );
  children.push(spacer(100));
  children.push(
    bodyText(
      "The heap uses a bump allocator with region-based reclamation. Each function invocation creates a memory region; when the function returns, the entire region is freed by resetting the heap pointer to the region's base address. This provides O(1) deallocation and eliminates fragmentation. Long-lived allocations (global variables, large matrices) are placed in a persistent root region that is never freed. The programmer can explicitly manage the persistent region using alloc() and free() primitives, but most programs never need to."
    )
  );
  children.push(
    bodyText(
      "Matrices are stored in row-major order as contiguous arrays of 64-bit floating-point values. A 1000\u00D71000 matrix of doubles occupies approximately 8MB. The VM supports matrices up to 65536\u00D765536 (4 billion entries, 32GB) in theory, but the practical limit is determined by available heap space. Sparse matrices use a separate CSR (Compressed Sparse Row) format that stores only non-zero values, reducing memory usage for matrices with many zeros."
    )
  );

  children.push(heading2("8.3 Bytecode Format"));
  children.push(
    bodyText(
      "Each bytecode instruction is a fixed-size 32-bit word. The most significant 8 bits encode the opcode, and the remaining 24 bits encode the operand (an immediate value or offset). This compact encoding keeps the code segment small and improves instruction cache utilization. The VM supports 256 unique opcodes, of which Version 1.0 uses approximately 80."
    )
  );
  children.push(
    makeTable(
      ["Opcode", "Hex", "Operand", "Description"],
      [
        ["PUSH_INT", "0x01", "24-bit signed int", "Push integer constant"],
        ["PUSH_FLOAT", "0x02", "20-bit float index", "Push float from constant pool"],
        ["PUSH_STR", "0x03", "20-bit string index", "Push string from constant pool"],
        ["LOAD", "0x04", "16-bit variable index", "Load variable onto stack"],
        ["STORE", "0x05", "16-bit variable index", "Pop stack into variable"],
        ["ADD", "0x10", "0", "Pop two, push sum"],
        ["SUB", "0x11", "0", "Pop two, push difference"],
        ["MUL", "0x12", "0", "Pop two, push product"],
        ["DIV", "0x13", "0", "Pop two, push quotient"],
        ["POW", "0x14", "0", "Pop base and exp, push power"],
        ["CMP_EQ", "0x20", "0", "Pop two, push Iverson [a=b]"],
        ["JUMP", "0x30", "24-bit offset", "Unconditional jump"],
        ["JUMP_IF_0", "0x31", "24-bit offset", "Jump if top of stack is 0"],
        ["CALL", "0x40", "16-bit function index", "Call function"],
        ["RETURN", "0x41", "0", "Return from function"],
        ["OUTPUT", "0x50", "0", "Pop and print to stdout"],
        ["HALT", "0xFF", "0", "Stop execution"],
      ]
    )
  );
  children.push(spacer(100));

  children.push(heading2("8.4 Compilation Pipeline"));
  children.push(
    bodyText(
      "The Void Code compiler operates in four phases, transforming source code into executable bytecode in a single pass where possible:"
    )
  );
  children.push(
    bodyPara([
      boldRun("Phase 1 \u2014 Tokenization: "),
      bodyRun("The Unicode-aware lexer reads the source file as UTF-8 and produces a stream of tokens. Each token carries a type (operator, number, identifier, string, delimiter), a value, and a source location. The lexer handles multi-byte Unicode operators, subscript/superscript notation, and string interpolation. Unicode normalization is applied to ensure that visually identical characters (e.g., different representations of the minus sign) map to the same internal token."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Phase 2 \u2014 Parsing: "),
      bodyRun("The parser consumes the token stream and produces an Abstract Syntax Tree (AST) using recursive descent. The grammar is LL(1), meaning the parser can decide which production to use by looking at only the next token. Error reporting includes the exact source location and a description of what was expected versus what was found."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Phase 3 \u2014 Semantic Analysis: "),
      bodyRun("The semantic analyzer walks the AST to perform type checking, type inference, and symbol resolution. It builds a symbol table mapping variable names to their types and stack offsets. Function definitions are checked for correct arity and valid recursive references. This phase also performs constant folding, dead code elimination, and tail-call detection."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Phase 4 \u2014 Code Generation: "),
      bodyRun("The code generator traverses the annotated AST and emits 32-bit bytecode instructions. Expressions are compiled using a stack machine model: each expression pushes its result onto the virtual stack. Control flow constructs (Iverson brackets, summation, set builders) are compiled to appropriate jump instruction sequences. The output is a binary bytecode file ready for VM execution."),
    ])
  );

  // ========================
  // SECTION 9: Comparison
  // ========================
  children.push(heading1("9. Comparison with Other Languages"));
  children.push(
    bodyText(
      "To contextualize Void Code within the existing programming language landscape, this section provides a detailed comparison with four languages that share some of Void Code's characteristics: Python (general-purpose, widely used), APL (array-oriented, symbolic), Julia (scientific computing), and Haskell (functional, mathematical). The comparison highlights where Void Code's design choices diverge from and improve upon existing approaches."
    )
  );
  children.push(spacer(60));
  children.push(
    makeTable(
      ["Feature", "Void Code", "Python", "APL", "Julia", "Haskell"],
      [
        ["Math Symbols", "Native (\u03A3, \u222B, \u2200)", "Library", "Native", "Unicode input", "Library"],
        ["Code Density", "Ultra (50:1 vs Python)", "1:1 baseline", "High (10:1)", "Medium (3:1)", "Medium (5:1)"],
        ["RAM Target", "2 GB", "512 MB min", "256 MB", "4 GB typical", "2 GB typical"],
        ["AI-Generated", "Designed for it", "Possible", "Hard (glyphs)", "Possible", "Hard (types)"],
        ["Set Theory", "Built-in syntax", "Library (set)", "Partial", "Library (Set)", "Library (Data.Set)"],
        ["Linear Algebra", "Built-in syntax", "NumPy required", "Native", "Built-in", "Library (hmatrix)"],
        ["Calculus Notation", "Built-in (\u222B, \u2202, \u2207)", "SymPy", "No", "No", "No"],
        ["Learning Curve", "Math knowledge", "Easy", "Very Hard", "Medium", "Hard"],
        ["Garbage Collection", "None (regions)", "Yes (refcount)", "Yes", "Yes (GC)", "Yes (GC)"],
        ["Compilation", "Bytecode VM", "Interp + .pyc", "Interpreted", "JIT (LLVM)", "Compiled (GHC)"],
      ]
    )
  );
  children.push(spacer(100));
  children.push(
    bodyText(
      "Void Code occupies a unique position in this landscape. It combines APL's symbolic density with a mathematical vocabulary that is universally taught (unlike APL's specialized glyphs). It matches Julia's scientific computing capability while requiring a fraction of the memory. And it achieves Haskell's functional purity without requiring advanced type system knowledge. The key differentiator is that Void Code is purpose-built for AI generation: its syntax is a subset of the notation that LLMs already understand from mathematical training data."
    )
  );
  children.push(
    bodyText(
      "The most significant advantage over Python is the elimination of boilerplate. A Python program that imports NumPy, defines a function, loops over data, and prints results typically runs 15\u201330 lines. The equivalent Void Code program is 1\u20133 lines. For AI code generation, this density means the model can produce complete programs within token limits, reducing truncation errors and the need for multi-turn generation. The comparison with APL is particularly instructive: while APL achieved remarkable density, its keyboard-driven input method and proprietary glyphs created a barrier to adoption that Void Code avoids by using standard Unicode mathematical symbols available on any modern device."
    )
  );

  // ========================
  // SECTION 10: Ecosystem Feasibility
  // ========================
  children.push(heading1("10. Phase 2 \u2014 Ecosystem Feasibility Analysis"));
  children.push(
    bodyText(
      "Beyond the language itself, the Void Code project envisions a complete ecosystem that enables AI-driven programming on resource-constrained devices. This section analyzes the feasibility of three core ecosystem components: an AI compiler that translates natural language to Void Code, a Termux-based Android runtime, and a decentralized script store built on GitHub Issues. Each analysis includes technical requirements, implementation approach, risk assessment, and a feasibility verdict."
    )
  );

  children.push(heading2("10.1 The AI Compiler (Natural Language \u2192 Void Code)"));
  children.push(
    bodyText(
      "The AI Compiler is a lightweight transformer model trained to translate natural language descriptions into syntactically correct and semantically valid Void Code programs. The goal is a model under 100MB that can run on a 2GB device with inference latency under 500ms. This section analyzes the technical feasibility of this component."
    )
  );
  children.push(
    bodyPara([
      boldRun("Model Architecture: "),
      bodyRun("A 6-layer transformer encoder-decoder with 256-dimensional embeddings, 4 attention heads, and a feed-forward dimension of 1024. Total parameters: approximately 22 million (88MB in FP32, 44MB in FP16, 22MB in INT8). This is comparable to DistilGPT-2 in scale and well within the capacity of modern mobile NPUs."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Tokenizer: "),
      bodyRun("A custom Byte Pair Encoding (BPE) tokenizer with a vocabulary of 5,000 tokens. The vocabulary is math-aware: common mathematical symbols (\u03A3, \u222B, \u2200, \u2203, \u03BB, \u2208) are individual tokens, while common programming constructs (function definitions, set builders, Iverson brackets) are multi-symbol tokens. The tokenizer is trained on a corpus of mathematical text and Void Code source."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Training Data: "),
      bodyRun("A corpus of approximately 50,000 natural language\u2013to\u2013Void Code pairs, generated through a combination of hand-authored examples (5,000 pairs), synthetic generation from mathematical textbooks (25,000 pairs), and automated translation from existing Python/Julia codebases (20,000 pairs). Data augmentation includes paraphrasing, variable renaming, and expression simplification."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Expected Performance: "),
      bodyRun("Based on analogous models (CodeT5-small, DistilGPT-2), we project 85\u201392% syntactic accuracy on common programming tasks (arithmetic, linear algebra, statistics, file I/O) and 70\u201380% semantic accuracy (the generated code does what the user intended). Accuracy on complex tasks (neural networks, ODE solving) is expected to be lower (60\u201375%) but will improve with fine-tuning."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Feasibility Verdict: FEASIBLE. "),
      bodyRun("The model size, training data requirements, and inference latency are all within proven ranges for mobile deployment. The primary risk is training data quality; mitigated by a hybrid hand-authored and synthetic approach. A fallback rule-based compiler can handle simple cases while the neural model handles ambiguous or complex queries."),
    ])
  );

  children.push(heading2("10.2 Termux Integration (Android Backend)"));
  children.push(
    bodyText(
      "Termux is a mature Android application that provides a full Linux userspace without root access. It supports package management (apt), SSH, programming languages (Python, Node.js, Ruby), and system utilities. Integrating Void Code with Termux provides an instant deployment platform for millions of Android devices."
    )
  );
  children.push(
    bodyPara([
      boldRun("Technical Approach: "),
      bodyRun("The Void Code VM is compiled as a single static binary using musl libc, producing an executable of approximately 2MB. This binary is distributed as a Termux package via a custom void-pkg repository. No root access is required. The binary includes the bytecode compiler, VM interpreter, and standard library. File system access uses standard POSIX APIs available through Termux's Linux environment."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Android Integration: "),
      bodyRun("Termux provides APIs for accessing Android hardware (camera, sensors, clipboard, notifications) through the Termux:API add-on. Void Code can expose these as standard library functions: camera() captures an image, sensor(type) reads device sensors, notify(title, body) displays a notification. This bridges the gap between Void Code's mathematical core and Android's capabilities."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Feasibility Verdict: HIGHLY FEASIBLE. "),
      bodyRun("Termux has over 10 million installations and an active development community. The POSIX compatibility layer is mature, and static binary compilation is well-documented. The primary consideration is performance on ARM processors, where the VM should be compiled with NEON SIMD instructions for accelerated matrix operations."),
    ])
  );

  children.push(heading2("10.3 Decentralized Script Store (GitHub Issues)"));
  children.push(
    bodyText(
      "The Void Code script store provides a community-driven repository of reusable Void Code programs, analogous to npm for JavaScript or PyPI for Python. The novel approach uses GitHub Issues as the storage and distribution backend, eliminating the need for dedicated infrastructure."
    )
  );
  children.push(
    bodyPara([
      boldRun("Architecture: "),
      bodyRun("Scripts are uploaded as GitHub Issues on a designated repository (void-core/scripts). Each issue represents one script, with the title serving as the script name, the body containing the Void Code source code in a fenced code block, and labels providing category metadata ([math], [ml], [io], [stats], etc.). Metadata (author, version, description) is embedded in a structured header within the issue body."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Discovery and Search: "),
      bodyRun("The GitHub Issues API supports searching by title, labels, and body content. The void CLI tool wraps this API with user-friendly commands: void search \"fibonacci\" queries the repository; void install fibonacci downloads and caches the script; void list --category math lists all scripts in the math category. Scripts are cached locally in ~/.void/scripts/ for offline access."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Quality and Curation: "),
      bodyRun("Community curation uses GitHub reactions: a script with 10+ thumbs-up reactions is marked as \"verified\" in search results. Issue comments serve as a review and discussion forum. Versioning is handled through issue edits: each edit creates a version history accessible via the GitHub API. Dependency management is intentionally minimal; most Void Code scripts are self-contained."),
    ])
  );
  children.push(
    bodyPara([
      boldRun("Feasibility Verdict: FEASIBLE. "),
      bodyRun("GitHub Issues is a proven, reliable, and free infrastructure. The API is well-documented and rate-limited but sufficient for individual use. No additional servers, databases, or authentication systems are needed. The primary risk is rate limiting for popular repositories; mitigated by local caching and conditional API requests (If-None-Match headers)."),
    ])
  );

  children.push(heading2("10.4 Summary Risk Matrix"));
  children.push(
    bodyText(
      "The following table summarizes the risks associated with each ecosystem component, along with the assessed risk level and proposed mitigation strategies. Risks are categorized as Low, Medium, or High based on the probability of occurrence and the potential impact on the project timeline."
    )
  );
  children.push(spacer(60));
  children.push(
    makeTable(
      ["Component", "Risk Level", "Key Risks", "Mitigation Strategy"],
      [
        [
          "AI Compiler",
          "Medium",
          "Training data quality; accuracy on complex tasks; model size constraints",
          "Hybrid approach: rule-based for simple cases, neural for complex; iterative fine-tuning with community feedback",
        ],
        [
          "Termux Backend",
          "Low",
          "Performance on low-end ARM devices; Termux API changes",
          "NEON SIMD optimization; static binary with no dynamic dependencies; automated CI testing on Termux",
        ],
        [
          "Script Store",
          "Low",
          "GitHub API rate limits; spam/low-quality scripts",
          "Local caching with ETags; community curation via reactions; automated quality checks on upload",
        ],
        [
          "Performance (2GB)",
          "Medium",
          "Large matrix operations exceeding memory; VM overhead",
          "Configurable matrix size limits; streaming evaluation for set builders; swap to disk for overflow",
        ],
        [
          "Unicode Rendering",
          "Low",
          "Terminal/font compatibility for math symbols",
          "Consolas fallback for missing glyphs; ASCII alias mode for all operators; terminal detection at startup",
        ],
      ]
    )
  );
  children.push(spacer(100));
  children.push(
    bodyText(
      "Overall, the Void Code ecosystem is technically feasible with manageable risks. The highest-risk component (the AI Compiler) is also the most modular: it can be developed incrementally, starting with a rule-based system and evolving toward a neural approach as training data accumulates. The Termux and GitHub Issues components leverage proven, battle-tested infrastructure that requires minimal custom development. The project's risk profile is favorable for a Phase 2 development timeline of 6\u201312 months."
    )
  );

  // Build the body section
  return {
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.25),
          right: convertInchesToTwip(1.25),
        },
        size: { width: 12240, height: 15840 },
      },
      type: SectionType.CONTINUOUS,
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Void Code Language Specification",
                font: "Calibri",
                size: 18,
                color: DM1.gray,
              }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                children: [PageNumber.CURRENT],
                font: "Calibri",
                size: 18,
                color: DM1.gray,
              }),
            ],
          }),
        ],
      }),
    },
    children,
  };
}

// ============================================================
// BUILD DOCUMENT
// ============================================================
async function main() {
  const doc = new Document({
    creator: "Void Core Project",
    title: "Void Code Language Specification v1.0",
    description: "The Assembly Language of AI — Complete Language Specification",
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 24,
            color: DM1.bodyText,
          },
          paragraph: {
            spacing: { line: 360, lineRule: LineRuleType.AUTO },
          },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: {
            font: "Times New Roman",
            size: 36,
            bold: true,
            color: DM1.tableHeaderBg,
          },
          paragraph: {
            spacing: { before: 400, after: 200 },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: {
            font: "Times New Roman",
            size: 28,
            bold: true,
            color: DM1.tableHeaderBg,
          },
          paragraph: {
            spacing: { before: 300, after: 150 },
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          run: {
            font: "Times New Roman",
            size: 24,
            bold: true,
            color: "3A7D8C",
          },
          paragraph: {
            spacing: { before: 200, after: 100 },
          },
        },
      ],
    },
    sections: [buildCoverSection(), buildTocSection(), buildBody()],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = "/home/z/my-project/download/Void_Code_Language_Specification.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document saved to: ${outputPath}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("Error generating document:", err);
  process.exit(1);
});
