// ============================================================
// VOID MIX: HYBRID MODEL
// Combines VOID 1 (Coder) + VOID 2 (Linguist)
// ============================================================

const Void1Coder = require('./void1.js');
const Void2Linguist = require('./void2.js');

class VoidMix {
  constructor() {
    this.coder = new Void1Coder();
    this.linguist = new Void2Linguist();
  }

  classifyTask(input) {
    const keywords = {
      coding: ['code', 'function', 'algorithm', 'compute', 'calculate'],
      reasoning: ['think', 'analyze', 'why', 'how', 'explain'],
      creative: ['write', 'poem', 'story', 'create', 'imagine']
    };

    let scores = { coding: 0, reasoning: 0, creative: 0 };
    const lower = input.toLowerCase();

    for (const [type, words] of Object.entries(keywords)) {
      words.forEach(word => {
        if (lower.includes(word)) scores[type]++;
      });
    }

    const maxType = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );

    return { type: maxType, scores };
  }

  process(userInput) {
    const classification = this.classifyTask(userInput);

    let result = {
      input: userInput,
      taskType: classification.type,
      response: {}
    };

    // Coding task - use VOID 1 primarily
    if (classification.type === 'coding') {
      const codeResult = this.coder.generateCode(userInput);
      result.response = {
        ...codeResult,
        fromModel: 'VOID 1 (Coder)',
        reasoning: 'Task classified as coding - generating optimized Void code'
      };
    }
    // Reasoning task - use VOID 2 primarily
    else if (classification.type === 'reasoning') {
      const thinkingResult = this.linguist.analyze(userInput);
      result.response = {
        analysis: thinkingResult,
        fromModel: 'VOID 2 (Linguist)',
        reasoning: 'Task classified as reasoning - applying deep thinking'
      };
    }
    // Creative task - use VOID 2
    else if (classification.type === 'creative') {
      const poetry = this.linguist.writePoetry(userInput.split(' ')[0]);
      result.response = {
        creative: poetry,
        fromModel: 'VOID 2 (Linguist)',
        reasoning: 'Task classified as creative - generating original content'
      };
    }
    // Mixed - use both
    else {
      const code = this.coder.generateCode(userInput);
      const thinking = this.linguist.analyze(userInput);
      result.response = {
        code: code.code,
        thinking: thinking.thinking,
        fromModel: 'VOID MIX (Both)',
        reasoning: 'Task requires both coding and reasoning - blending responses'
      };
    }

    return result;
  }
}

if (typeof module !== 'undefined') {
  module.exports = VoidMix;
}
