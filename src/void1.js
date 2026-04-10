// ============================================================
// VOID 1: CODER MODEL
// Understands English → Generates Void Code
// ============================================================

class Void1Coder {
  constructor() {
    this.knowledge = {
      'fibonacci': `fib(n) = (n <= 1) ? n : fib(n-1) + fib(n-2)`,
      'factorial': `fact(n) = (n <= 1) ? 1 : n * fact(n-1)`,
      'sum': `sum ← 0; for i ← 1 to 100 { sum ← sum + i; }; sum → print`,
      'prime': `is_prime(n) = (n < 2) ? 0 : (n == 2) ? 1 : (n % 2 == 0) ? 0 : 1`,
      'sqrt': `result ← sqrt(16); result → print`,
      'power': `result ← 2 ^ 10; result → print`,
      'average': `arr ← {1, 2, 3, 4, 5}; avg ← (1+2+3+4+5)/5; avg → print`,
      'gcd': `gcd(a,b) = (b == 0) ? a : gcd(b, a % b)`
    };
  }

  understand(english_request) {
    const req = english_request.toLowerCase();
    
    // Find matching keyword
    for (const [key, code] of Object.entries(this.knowledge)) {
      if (req.includes(key)) {
        return { matched: true, code, topic: key };
      }
    }

    // Default: simple math
    if (req.includes('calculate') || req.includes('compute')) {
      return { 
        matched: true, 
        code: `result ← 2 + 3; result → print`, 
        topic: 'basic_math' 
      };
    }

    return { matched: false, code: null, topic: null };
  }

  generateCode(english_request) {
    const understood = this.understand(english_request);
    
    if (understood.matched) {
      return {
        success: true,
        code: understood.code,
        explanation: `Generated Void code for: ${understood.topic}`,
        request: english_request
      };
    }

    return {
      success: false,
      code: null,
      explanation: `Could not understand: "${english_request}"`,
      request: english_request
    };
  }
}

if (typeof module !== 'undefined') {
  module.exports = Void1Coder;
}
