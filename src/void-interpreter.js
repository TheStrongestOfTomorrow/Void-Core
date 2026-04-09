// ============================================================
// VOID LANGUAGE INTERPRETER
// Pure Mathematical Programming Language Parser & Executor
// ============================================================

class VoidInterpreter {
  constructor() {
    this.variables = new Map();
    this.functions = new Map();
    this.output = [];
    this.stack = [];
    this.memory = new Map();
    this.executionDepth = 0;
    this.maxDepth = 1000;
  }

  // ============================================================
  // TOKENIZER - Convert Void code to tokens
  // ============================================================

  tokenize(code) {
    const tokens = [];
    let i = 0;

    const operators = {
      '←': 'ASSIGN',
      '→': 'OUTPUT',
      'Σ': 'SUM',
      '∏': 'PRODUCT',
      '∫': 'INTEGRAL',
      '∂': 'DERIVATIVE',
      '∀': 'FORALL',
      '∃': 'EXISTS',
      '∈': 'IN',
      '∉': 'NOTIN',
      '⊆': 'SUBSET',
      '∩': 'INTERSECTION',
      '∪': 'UNION',
      '⊕': 'XOR',
      '·': 'DOT',
      '⁺': 'SUPERSCRIPT_PLUS',
      '⁻': 'SUPERSCRIPT_MINUS',
      '[': 'LBRACKET',
      ']': 'RBRACKET',
      '{': 'LBRACE',
      '}': 'RBRACE',
      '(': 'LPAREN',
      ')': 'RPAREN',
      ',': 'COMMA',
      ';': 'SEMICOLON',
      '=': 'EQUAL',
      '+': 'PLUS',
      '-': 'MINUS',
      '*': 'TIMES',
      '/': 'DIVIDE',
      '^': 'POWER',
      '%': 'MOD',
      '|': 'PIPE',
      '&': 'AND',
      '≤': 'LTE',
      '≥': 'GTE',
      '<': 'LT',
      '>': 'GT',
      '≠': 'NE',
      '¬': 'NOT',
      'T': 'TRANSPOSE',
    };

    while (i < code.length) {
      // Skip whitespace
      if (/\s/.test(code[i])) {
        i++;
        continue;
      }

      // String literals
      if (code[i] === '"') {
        let str = '';
        i++;
        while (i < code.length && code[i] !== '"') {
          str += code[i];
          i++;
        }
        i++; // Skip closing quote
        tokens.push({ type: 'STRING', value: str });
        continue;
      }

      // Numbers
      if (/\d/.test(code[i]) || (code[i] === '.' && /\d/.test(code[i + 1]))) {
        let num = '';
        while (i < code.length && /[\d.]/.test(code[i])) {
          num += code[i];
          i++;
        }
        tokens.push({
          type: num.includes('.') ? 'FLOAT' : 'INT',
          value: num.includes('.') ? parseFloat(num) : parseInt(num),
        });
        continue;
      }

      // Multi-character operators
      const twoChar = code.substr(i, 2);
      if (operators[twoChar]) {
        tokens.push({ type: operators[twoChar], value: twoChar });
        i += 2;
        continue;
      }

      // Single character operators
      if (operators[code[i]]) {
        tokens.push({ type: operators[code[i]], value: code[i] });
        i++;
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(code[i])) {
        let ident = '';
        while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
          ident += code[i];
          i++;
        }
        tokens.push({ type: 'IDENT', value: ident });
        continue;
      }

      // Comments
      if (code[i] === '/' && code[i + 1] === '/') {
        while (i < code.length && code[i] !== '\n') {
          i++;
        }
        continue;
      }

      i++;
    }

    return tokens;
  }

  // ============================================================
  // PARSER - Convert tokens to AST
  // ============================================================

  parse(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    return this.parseProgram();
  }

  parseProgram() {
    const statements = [];
    while (this.pos < this.tokens.length) {
      statements.push(this.parseStatement());
    }
    return { type: 'PROGRAM', statements };
  }

  parseStatement() {
    const token = this.peek();

    // Output statement: expr → output
    if (this.peekType(1) === 'OUTPUT') {
      const expr = this.parseExpression();
      this.consume('OUTPUT');
      return { type: 'OUTPUT', expression: expr };
    }

    // Assignment: x ← expr
    if (this.peekType(1) === 'ASSIGN') {
      const name = this.consume('IDENT').value;
      this.consume('ASSIGN');
      const expr = this.parseExpression();
      return { type: 'ASSIGN', name, expression: expr };
    }

    // Summation: Σ_{i=1}^{n} expr
    if (token.type === 'SUM') {
      return this.parseSummation();
    }

    // Function definition: f(x, y) = expr
    if (token.type === 'IDENT' && this.peekType(1) === 'LPAREN') {
      return this.parseFunctionDef();
    }

    // Universal quantifier: ∀ x ∈ S { block }
    if (token.type === 'FORALL') {
      return this.parseForall();
    }

    // Just an expression
    return this.parseExpression();
  }

  parseSummation() {
    this.consume('SUM');
    let indexVar = 'i';
    let lowerBound = 1;
    let upperBound = null;
    let overSet = null;

    // Parse index variable and bounds
    if (this.peekType() === 'IDENT') {
      indexVar = this.consume('IDENT').value;
    }

    // Parse bounds or set membership
    if (this.peekType() === 'EQUAL') {
      this.consume('EQUAL');
      lowerBound = this.parseExpression();

      if (this.peekType() === 'POWER') {
        this.consume('POWER');
        upperBound = this.parseExpression();
      }
    } else if (this.peekType() === 'IN') {
      this.consume('IN');
      overSet = this.parseExpression();
    }

    const expr = this.parseExpression();

    return {
      type: 'SUM',
      indexVar,
      lowerBound,
      upperBound,
      overSet,
      expression: expr,
    };
  }

  parseForall() {
    this.consume('FORALL');
    const varName = this.consume('IDENT').value;
    this.consume('IN');
    const collection = this.parseExpression();

    // Parse block
    let block = [];
    if (this.peekType() === 'LBRACE') {
      this.consume('LBRACE');
      while (this.peekType() !== 'RBRACE') {
        block.push(this.parseStatement());
      }
      this.consume('RBRACE');
    }

    return {
      type: 'FORALL',
      variable: varName,
      collection,
      block,
    };
  }

  parseFunctionDef() {
    const name = this.consume('IDENT').value;
    this.consume('LPAREN');
    const params = [];
    while (this.peekType() !== 'RPAREN') {
      params.push(this.consume('IDENT').value);
      if (this.peekType() === 'COMMA') {
        this.consume('COMMA');
      }
    }
    this.consume('RPAREN');
    this.consume('EQUAL');
    const body = this.parseExpression();

    return {
      type: 'FUNC_DEF',
      name,
      params,
      body,
    };
  }

  parseExpression() {
    return this.parseOr();
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.peekType() === 'PIPE') {
      this.consume('PIPE');
      const right = this.parseAnd();
      left = { type: 'OR', left, right };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseComparison();
    while (this.peekType() === 'AND') {
      this.consume('AND');
      const right = this.parseComparison();
      left = { type: 'AND', left, right };
    }
    return left;
  }

  parseComparison() {
    let left = this.parseAddition();
    const compOps = ['LTE', 'GTE', 'LT', 'GT', 'EQUAL', 'NE'];
    while (compOps.includes(this.peekType())) {
      const op = this.consume(this.peekType()).type;
      const right = this.parseAddition();
      left = { type: 'COMPARE', op, left, right };
    }
    return left;
  }

  parseAddition() {
    let left = this.parseMultiplication();
    while (['PLUS', 'MINUS', 'UNION'].includes(this.peekType())) {
      const op = this.consume(this.peekType()).type;
      const right = this.parseMultiplication();
      left = { type: 'BINARY_OP', op, left, right };
    }
    return left;
  }

  parseMultiplication() {
    let left = this.parsePower();
    while (['TIMES', 'DIVIDE', 'DOT', 'INTERSECTION'].includes(this.peekType())) {
      const op = this.consume(this.peekType()).type;
      const right = this.parsePower();
      left = { type: 'BINARY_OP', op, left, right };
    }
    return left;
  }

  parsePower() {
    let left = this.parseUnary();
    if (this.peekType() === 'POWER') {
      this.consume('POWER');
      const right = this.parsePower();
      return { type: 'BINARY_OP', op: 'POWER', left, right };
    }
    return left;
  }

  parseUnary() {
    if (this.peekType() === 'NOT') {
      this.consume('NOT');
      const expr = this.parseUnary();
      return { type: 'NOT', expression: expr };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();

    if (!token) return null;

    // Numbers
    if (token.type === 'INT' || token.type === 'FLOAT') {
      this.pos++;
      return { type: 'NUMBER', value: token.value };
    }

    // Strings
    if (token.type === 'STRING') {
      this.pos++;
      return { type: 'STRING', value: token.value };
    }

    // Identifiers and function calls
    if (token.type === 'IDENT') {
      const name = this.consume('IDENT').value;

      // Function call
      if (this.peekType() === 'LPAREN') {
        this.consume('LPAREN');
        const args = [];
        while (this.peekType() !== 'RPAREN') {
          args.push(this.parseExpression());
          if (this.peekType() === 'COMMA') {
            this.consume('COMMA');
          }
        }
        this.consume('RPAREN');
        return { type: 'CALL', function: name, args };
      }

      // Variable reference
      return { type: 'VAR', name };
    }

    // Parenthesized expression
    if (token.type === 'LPAREN') {
      this.consume('LPAREN');
      const expr = this.parseExpression();
      this.consume('RPAREN');
      return expr;
    }

    // Set literal: {1, 2, 3}
    if (token.type === 'LBRACE') {
      this.consume('LBRACE');
      const elements = [];
      while (this.peekType() !== 'RBRACE') {
        elements.push(this.parseExpression());
        if (this.peekType() === 'COMMA') {
          this.consume('COMMA');
        }
      }
      this.consume('RBRACE');
      return { type: 'SET', elements };
    }

    // Matrix literal: [[1, 2], [3, 4]]
    if (token.type === 'LBRACKET') {
      this.consume('LBRACKET');
      const rows = [];
      while (this.peekType() !== 'RBRACKET') {
        if (this.peekType() === 'LBRACKET') {
          this.consume('LBRACKET');
          const row = [];
          while (this.peekType() !== 'RBRACKET') {
            row.push(this.parseExpression());
            if (this.peekType() === 'COMMA') {
              this.consume('COMMA');
            }
          }
          this.consume('RBRACKET');
          rows.push(row);
        }
        if (this.peekType() === 'COMMA') {
          this.consume('COMMA');
        }
      }
      this.consume('RBRACKET');
      return { type: 'MATRIX', rows };
    }

    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  }

  // ============================================================
  // EXECUTOR - Run AST
  // ============================================================

  execute(ast) {
    if (ast.type === 'PROGRAM') {
      ast.statements.forEach(stmt => this.executeStatement(stmt));
      return this.output;
    }
    return this.executeExpression(ast);
  }

  executeStatement(stmt) {
    if (!stmt) return null;

    switch (stmt.type) {
      case 'ASSIGN':
        const value = this.executeExpression(stmt.expression);
        this.variables.set(stmt.name, value);
        return value;

      case 'OUTPUT':
        const output = this.executeExpression(stmt.expression);
        this.output.push(output);
        return output;

      case 'SUM':
        return this.executeSummation(stmt);

      case 'FORALL':
        return this.executeForall(stmt);

      case 'FUNC_DEF':
        this.functions.set(stmt.name, stmt);
        return null;

      default:
        return this.executeExpression(stmt);
    }
  }

  executeSummation(stmt) {
    let total = 0;

    if (stmt.overSet) {
      const set = this.executeExpression(stmt.overSet);
      if (Array.isArray(set)) {
        set.forEach(val => {
          this.variables.set(stmt.indexVar, val);
          total += this.executeExpression(stmt.expression);
        });
      }
    } else {
      const lower = this.executeExpression(stmt.lowerBound);
      const upper = this.executeExpression(stmt.upperBound || 10);
      for (let i = lower; i <= upper; i++) {
        this.variables.set(stmt.indexVar, i);
        total += this.executeExpression(stmt.expression);
      }
    }

    return total;
  }

  executeForall(stmt) {
    const collection = this.executeExpression(stmt.collection);
    const results = [];

    if (Array.isArray(collection)) {
      collection.forEach(item => {
        this.variables.set(stmt.variable, item);
        stmt.block.forEach(s => {
          results.push(this.executeStatement(s));
        });
      });
    }

    return results;
  }

  executeExpression(expr) {
    if (!expr) return null;

    switch (expr.type) {
      case 'NUMBER':
        return expr.value;

      case 'STRING':
        return expr.value;

      case 'VAR':
        return this.variables.get(expr.name);

      case 'SET':
        return expr.elements.map(e => this.executeExpression(e));

      case 'MATRIX':
        return expr.rows.map(row => row.map(e => this.executeExpression(e)));

      case 'BINARY_OP':
        return this.executeBinaryOp(expr);

      case 'COMPARE':
        return this.executeComparison(expr);

      case 'AND':
        return (
          this.executeExpression(expr.left) &&
          this.executeExpression(expr.right)
        )
          ? 1
          : 0;

      case 'OR':
        return (
          this.executeExpression(expr.left) ||
          this.executeExpression(expr.right)
        )
          ? 1
          : 0;

      case 'NOT':
        return this.executeExpression(expr.expression) ? 0 : 1;

      case 'CALL':
        return this.executeCall(expr);

      default:
        return null;
    }
  }

  executeBinaryOp(expr) {
    const left = this.executeExpression(expr.left);
    const right = this.executeExpression(expr.right);

    switch (expr.op) {
      case 'PLUS':
      case 'UNION':
        return left + right;
      case 'MINUS':
        return left - right;
      case 'TIMES':
        return left * right;
      case 'DIVIDE':
        return left / right;
      case 'POWER':
        return Math.pow(left, right);
      case 'MOD':
        return left % right;
      case 'DOT':
        return left * right; // Simplified dot product
      case 'INTERSECTION':
        if (Array.isArray(left) && Array.isArray(right)) {
          return left.filter(x => right.includes(x));
        }
        return left & right;
      default:
        return 0;
    }
  }

  executeComparison(expr) {
    const left = this.executeExpression(expr.left);
    const right = this.executeExpression(expr.right);

    let result = false;
    switch (expr.op) {
      case 'EQUAL':
        result = left === right;
        break;
      case 'NE':
        result = left !== right;
        break;
      case 'LT':
        result = left < right;
        break;
      case 'LTE':
        result = left <= right;
        break;
      case 'GT':
        result = left > right;
        break;
      case 'GTE':
        result = left >= right;
        break;
    }
    return result ? 1 : 0;
  }

  executeCall(expr) {
    const funcDef = this.functions.get(expr.function);
    if (funcDef) {
      const savedVars = new Map(this.variables);
      expr.args.forEach((arg, i) => {
        this.variables.set(
          funcDef.params[i],
          this.executeExpression(arg)
        );
      });
      const result = this.executeExpression(funcDef.body);
      this.variables = savedVars;
      return result;
    }

    // Built-in functions
    const args = expr.args.map(a => this.executeExpression(a));
    return this.executeBuiltinFunction(expr.function, args);
  }

  executeBuiltinFunction(name, args) {
    switch (name) {
      case 'sin':
        return Math.sin(args[0]);
      case 'cos':
        return Math.cos(args[0]);
      case 'tan':
        return Math.tan(args[0]);
      case 'sqrt':
        return Math.sqrt(args[0]);
      case 'abs':
        return Math.abs(args[0]);
      case 'floor':
        return Math.floor(args[0]);
      case 'ceil':
        return Math.ceil(args[0]);
      case 'round':
        return Math.round(args[0]);
      case 'max':
        return Math.max(...args);
      case 'min':
        return Math.min(...args);
      case 'len':
        return args[0].length;
      case 'sum':
        return args[0].reduce((a, b) => a + b, 0);
      case 'mean':
        return args[0].reduce((a, b) => a + b, 0) / args[0].length;
      default:
        return 0;
    }
  }

  peek() {
    return this.tokens[this.pos];
  }

  peekType(offset = 0) {
    const token = this.tokens[this.pos + offset];
    return token ? token.type : null;
  }

  consume(type) {
    const token = this.tokens[this.pos];
    if (!token || token.type !== type) {
      throw new Error(`Expected ${type}, got ${token?.type}`);
    }
    this.pos++;
    return token;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  run(code) {
    try {
      const tokens = this.tokenize(code);
      const ast = this.parse(tokens);
      return this.execute(ast);
    } catch (err) {
      return { error: err.message };
    }
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoidInterpreter;
}
