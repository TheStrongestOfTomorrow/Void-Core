// ============================================================
// VOID LANGUAGE - REAL WORKING VERSION
// Can print "Hi", do math, work with functions
// ============================================================

class Void {
  constructor() {
    this.vars = {};
    this.output = [];
  }

  run(code) {
    this.output = [];
    const lines = code.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('//'));

    for (const line of lines) {
      this.executeLine(line);
    }
    return this.output;
  }

  executeLine(line) {
    // "Hi" → print
    if (line.includes('→')) {
      const [expr] = line.split('→');
      let val = this.evaluate(expr.trim());
      this.output.push(val);
      return;
    }

    // x ← 5
    if (line.includes('←')) {
      const [varName, expr] = line.split('←');
      this.vars[varName.trim()] = this.evaluate(expr.trim());
      return;
    }

    // Just evaluate
    this.evaluate(line);
  }

  evaluate(expr) {
    expr = expr.trim();

    // String literals: "hello"
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }

    // Numbers
    if (!isNaN(expr)) {
      return parseFloat(expr);
    }

    // Variables
    if (this.vars[expr] !== undefined) {
      return this.vars[expr];
    }

    // Math expressions
    try {
      // Replace Void operators
      let js_expr = expr
        .replace(/\^/g, '**')
        .replace(/÷/g, '/')
        .replace(/×/g, '*');

      // Math functions
      js_expr = js_expr
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/floor\(/g, 'Math.floor(')
        .replace(/ceil\(/g, 'Math.ceil(')
        .replace(/round\(/g, 'Math.round(')
        .replace(/pow\(/g, 'Math.pow(')
        .replace(/log\(/g, 'Math.log(')
        .replace(/exp\(/g, 'Math.exp(');

      return eval(js_expr);
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = Void;
}
