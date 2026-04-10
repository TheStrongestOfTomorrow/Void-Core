// ============================================================
// VOID LANGUAGE INTERPRETER - REAL WORKING VERSION
// Actually executes code, prints output, does math
// ============================================================

class VoidRuntime {
  constructor() {
    this.vars = new Map();
    this.functions = new Map();
    this.output = [];
    this.stack = [];
  }

  // ============================================================
  // TOKENIZER - Real token parsing
  // ============================================================
  
  tokenize(code) {
    const tokens = [];
    let i = 0;

    while (i < code.length) {
      // Skip whitespace
      if (/\s/.test(code[i])) {
        i++;
        continue;
      }

      // Comments
      if (code[i] === '/' && code[i + 1] === '/') {
        while (i < code.length && code[i] !== '\n') i++;
        continue;
      }

      // Strings
      if (code[i] === '"') {
        let str = '';
        i++;
        while (i < code.length && code[i] !== '"') {
          if (code[i] === '\\') {
            i++;
            switch (code[i]) {
              case 'n': str += '\n'; break;
              case 't': str += '\t'; break;
              case '"': str += '"'; break;
              default: str += code[i];
            }
          } else {
            str += code[i];
          }
          i++;
        }
        i++;
        tokens.push({ type: 'STRING', val: str });
        continue;
      }

      // Numbers
      if (/\d/.test(code[i]) || (code[i] === '.' && /\d/.test(code[i + 1]))) {
        let num = '';
        while (i < code.length && /[\d.]/.test(code[i])) {
          num += code[i++];
        }
        tokens.push({ type: 'NUMBER', val: parseFloat(num) });
        continue;
      }

      // Operators & keywords
      const twoChar = code.substr(i, 2);
      const threeChar = code.substr(i, 3);

      if (twoChar === '←' || twoChar === '<-' || twoChar === ':=') {
        tokens.push({ type: 'ASSIGN', val: '←' });
        i += twoChar === '←' ? 1 : 2;
        continue;
      }

      if (twoChar === '→' || twoChar === '->') {
        tokens.push({ type: 'OUTPUT', val: '→' });
        i += twoChar === '→' ? 1 : 2;
        continue;
      }

      if (twoChar === '==' || twoChar === '==') {
        tokens.push({ type: 'EQ', val: '==' });
        i += 2;
        continue;
      }

      if (twoChar === '!=' || twoChar === '<>') {
        tokens.push({ type: 'NE', val: '!=' });
        i += 2;
        continue;
      }

      if (twoChar === '<=' || twoChar === '≤') {
        tokens.push({ type: 'LTE', val: '<=' });
        i += twoChar === '<=' ? 2 : 1;
        continue;
      }

      if (twoChar === '>=' || twoChar === '≥') {
        tokens.push({ type: 'GTE', val: '>=' });
        i += twoChar === '>=' ? 2 : 1;
        continue;
      }

      // Single char operators
      const ch = code[i];
      const ops = {
        '+': 'PLUS', '-': 'MINUS', '*': 'MUL', '/': 'DIV',
        '%': 'MOD', '^': 'POW', '(': 'LPAREN', ')': 'RPAREN',
        '{': 'LBRACE', '}': 'RBRACE', '[': 'LBRACK', ']': 'RBRACK',
        ',': 'COMMA', ';': 'SEMI', '=': 'EQOP', '<': 'LT', '>': 'GT',
        '&': 'AND', '|': 'OR', '!': 'NOT', '~': 'NEG',
        '.': 'DOT', ':': 'COLON', '?': 'QUESTION',
        'Σ': 'SIGMA', '∏': 'PRODUCT', '∫': 'INTEGRAL',
        '∀': 'FORALL', '∈': 'IN', '∪': 'UNION', '∩': 'INTER'
      };

      if (ops[ch]) {
        tokens.push({ type: ops[ch], val: ch });
        i++;
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(ch)) {
        let ident = '';
        while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
          ident += code[i++];
        }

        const keywords = [
          'if', 'else', 'for', 'while', 'do', 'return',
          'function', 'var', 'const', 'let', 'true', 'false',
          'null', 'undefined', 'and', 'or', 'not', 'in'
        ];

        if (keywords.includes(ident)) {
          tokens.push({ type: ident.toUpperCase(), val: ident });
        } else {
          tokens.push({ type: 'IDENT', val: ident });
        }
        continue;
      }

      i++;
    }

    return tokens;
  }

  // ============================================================
  // PARSER - Build execution plan
  // ============================================================

  parse(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    const statements = [];

    while (!this.isDone()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }

    return statements;
  }

  parseStatement() {
    if (this.isDone()) return null;

    const tok = this.peek();

    // Assignment: x ← 5
    if (this.peekAhead(1)?.type === 'ASSIGN') {
      const name = this.consume('IDENT').val;
      this.consume('ASSIGN');
      const expr = this.parseExpr();
      this.skipSemi();
      return { type: 'ASSIGN', name, expr };
    }

    // Output: x → output
    if (this.peekAhead(1)?.type === 'OUTPUT') {
      const expr = this.parseExpr();
      this.consume('OUTPUT');
      this.skipSemi();
      return { type: 'OUTPUT', expr };
    }

    // Function definition: f(x,y) = x + y
    if (tok.type === 'IDENT' && this.peekAhead(1)?.type === 'LPAREN') {
      const name = this.consume('IDENT').val;
      this.consume('LPAREN');
      const params = [];
      while (this.peek().type !== 'RPAREN') {
        params.push(this.consume('IDENT').val);
        if (this.peek().type === 'COMMA') this.consume('COMMA');
      }
      this.consume('RPAREN');
      this.consume('EQOP');
      const body = this.parseExpr();
      this.skipSemi();
      return { type: 'FUNC', name, params, body };
    }

    // Just expression
    const expr = this.parseExpr();
    this.skipSemi();
    return { type: 'EXPR', expr };
  }

  parseExpr() {
    return this.parseOr();
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.peek().type === 'OR' || this.peek().val === '|') {
      this.consume(this.peek().type);
      const right = this.parseAnd();
      left = { type: 'OR', left, right };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseEq();
    while (this.peek().type === 'AND' || this.peek().val === '&') {
      this.consume(this.peek().type);
      const right = this.parseEq();
      left = { type: 'AND', left, right };
    }
    return left;
  }

  parseEq() {
    let left = this.parseComp();
    while (['EQ', 'NE', 'EQOP'].includes(this.peek().type)) {
      const op = this.consume(this.peek().type).type;
      const right = this.parseComp();
      left = { type: op, left, right };
    }
    return left;
  }

  parseComp() {
    let left = this.parseAdd();
    while (['LT', 'GT', 'LTE', 'GTE'].includes(this.peek().type)) {
      const op = this.consume(this.peek().type).type;
      const right = this.parseAdd();
      left = { type: op, left, right };
    }
    return left;
  }

  parseAdd() {
    let left = this.parseMul();
    while (['PLUS', 'MINUS'].includes(this.peek().type)) {
      const op = this.consume(this.peek().type).type;
      const right = this.parseMul();
      left = { type: op, left, right };
    }
    return left;
  }

  parseMul() {
    let left = this.parsePow();
    while (['MUL', 'DIV', 'MOD'].includes(this.peek().type)) {
      const op = this.consume(this.peek().type).type;
      const right = this.parsePow();
      left = { type: op, left, right };
    }
    return left;
  }

  parsePow() {
    let left = this.parseUnary();
    if (this.peek().type === 'POW') {
      this.consume('POW');
      const right = this.parsePow();
      return { type: 'POW', left, right };
    }
    return left;
  }

  parseUnary() {
    if (['NOT', 'NEG', 'MINUS'].includes(this.peek().type)) {
      const op = this.consume(this.peek().type).type;
      const expr = this.parseUnary();
      return { type: op, expr };
    }
    return this.parseCall();
  }

  parseCall() {
    let expr = this.parsePrimary();

    while (this.peek().type === 'LPAREN') {
      this.consume('LPAREN');
      const args = [];
      while (this.peek().type !== 'RPAREN') {
        args.push(this.parseExpr());
        if (this.peek().type === 'COMMA') this.consume('COMMA');
      }
      this.consume('RPAREN');
      expr = { type: 'CALL', func: expr, args };
    }

    return expr;
  }

  parsePrimary() {
    const tok = this.peek();

    if (tok.type === 'NUMBER') {
      this.consume('NUMBER');
      return { type: 'NUM', val: tok.val };
    }

    if (tok.type === 'STRING') {
      this.consume('STRING');
      return { type: 'STR', val: tok.val };
    }

    if (tok.type === 'IDENT') {
      const name = this.consume('IDENT').val;
      return { type: 'VAR', name };
    }

    if (tok.type === 'LPAREN') {
      this.consume('LPAREN');
      const expr = this.parseExpr();
      this.consume('RPAREN');
      return expr;
    }

    if (tok.type === 'LBRACE') {
      this.consume('LBRACE');
      const items = [];
      while (this.peek().type !== 'RBRACE') {
        items.push(this.parseExpr());
        if (this.peek().type === 'COMMA') this.consume('COMMA');
      }
      this.consume('RBRACE');
      return { type: 'ARRAY', items };
    }

    if (tok.type === 'LBRACK') {
      this.consume('LBRACK');
      const items = [];
      while (this.peek().type !== 'RBRACK') {
        items.push(this.parseExpr());
        if (this.peek().type === 'COMMA') this.consume('COMMA');
      }
      this.consume('RBRACK');
      return { type: 'ARRAY', items };
    }

    throw new Error(`Unexpected token: ${JSON.stringify(tok)}`);
  }

  // ============================================================
  // EXECUTOR - Actually run code
  // ============================================================

  execute(statements) {
    for (const stmt of statements) {
      this.execStatement(stmt);
    }
    return this.output;
  }

  execStatement(stmt) {
    if (!stmt) return null;

    switch (stmt.type) {
      case 'ASSIGN':
        const val = this.evalExpr(stmt.expr);
        this.vars.set(stmt.name, val);
        return val;

      case 'OUTPUT':
        const out = this.evalExpr(stmt.expr);
        this.output.push(out);
        return out;

      case 'FUNC':
        this.functions.set(stmt.name, stmt);
        return null;

      case 'EXPR':
        return this.evalExpr(stmt.expr);

      default:
        return this.evalExpr(stmt);
    }
  }

  evalExpr(expr) {
    if (!expr) return null;

    switch (expr.type) {
      case 'NUM':
        return expr.val;

      case 'STR':
        return expr.val;

      case 'VAR':
        return this.vars.has(expr.name) ? this.vars.get(expr.name) : 0;

      case 'ARRAY':
        return expr.items.map(e => this.evalExpr(e));

      case 'PLUS':
        return this.evalExpr(expr.left) + this.evalExpr(expr.right);

      case 'MINUS':
        return this.evalExpr(expr.left) - this.evalExpr(expr.right);

      case 'MUL':
        return this.evalExpr(expr.left) * this.evalExpr(expr.right);

      case 'DIV': {
        const denom = this.evalExpr(expr.right);
        return denom !== 0 ? this.evalExpr(expr.left) / denom : 0;
      }

      case 'MOD':
        return this.evalExpr(expr.left) % this.evalExpr(expr.right);

      case 'POW':
        return Math.pow(this.evalExpr(expr.left), this.evalExpr(expr.right));

      case 'EQ':
      case 'EQOP':
        return this.evalExpr(expr.left) === this.evalExpr(expr.right) ? 1 : 0;

      case 'NE':
        return this.evalExpr(expr.left) !== this.evalExpr(expr.right) ? 1 : 0;

      case 'LT':
        return this.evalExpr(expr.left) < this.evalExpr(expr.right) ? 1 : 0;

      case 'GT':
        return this.evalExpr(expr.left) > this.evalExpr(expr.right) ? 1 : 0;

      case 'LTE':
        return this.evalExpr(expr.left) <= this.evalExpr(expr.right) ? 1 : 0;

      case 'GTE':
        return this.evalExpr(expr.left) >= this.evalExpr(expr.right) ? 1 : 0;

      case 'AND':
        return (this.evalExpr(expr.left) && this.evalExpr(expr.right)) ? 1 : 0;

      case 'OR':
        return (this.evalExpr(expr.left) || this.evalExpr(expr.right)) ? 1 : 0;

      case 'NOT':
        return !this.evalExpr(expr.expr) ? 1 : 0;

      case 'NEG':
      case 'MINUS':
        return -this.evalExpr(expr.expr);

      case 'CALL':
        return this.callFunction(expr);

      default:
        return null;
    }
  }

  callFunction(expr) {
    const funcName = expr.func.name;
    const args = expr.args.map(a => this.evalExpr(a));

    // Built-in functions
    const builtins = {
      sin: x => Math.sin(x),
      cos: x => Math.cos(x),
      tan: x => Math.tan(x),
      sqrt: x => Math.sqrt(x),
      abs: x => Math.abs(x),
      floor: x => Math.floor(x),
      ceil: x => Math.ceil(x),
      round: x => Math.round(x),
      log: x => Math.log(x),
      exp: x => Math.exp(x),
      max: (...xs) => Math.max(...xs),
      min: (...xs) => Math.min(...xs),
      sum: arr => Array.isArray(arr) ? arr.reduce((a, b) => a + b, 0) : 0,
      mean: arr => Array.isArray(arr) ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
      len: x => Array.isArray(x) ? x.length : String(x).length,
      pow: (a, b) => Math.pow(a, b),
      mod: (a, b) => a % b,
      random: () => Math.random(),
      str: x => String(x),
      num: x => Number(x),
      print: x => { this.output.push(x); return x; },
    };

    if (builtins[funcName]) {
      return builtins[funcName](...args);
    }

    // User-defined functions
    const func = this.functions.get(funcName);
    if (func) {
      const oldVars = new Map(this.vars);
      func.params.forEach((param, i) => {
        this.vars.set(param, args[i]);
      });
      const result = this.evalExpr(func.body);
      this.vars = oldVars;
      return result;
    }

    return 0;
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  peek() {
    return this.tokens[this.pos] || { type: 'EOF' };
  }

  peekAhead(n) {
    return this.tokens[this.pos + n] || { type: 'EOF' };
  }

  consume(type) {
    const tok = this.peek();
    if (tok.type !== type && tok.type !== 'EOF') {
      throw new Error(`Expected ${type}, got ${tok.type}`);
    }
    this.pos++;
    return tok;
  }

  isDone() {
    return this.pos >= this.tokens.length;
  }

  skipSemi() {
    if (this.peek().type === 'SEMI') {
      this.consume('SEMI');
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  run(code) {
    try {
      const tokens = this.tokenize(code);
      const statements = this.parse(tokens);
      this.execute(statements);
      return {
        output: this.output,
        success: true,
        error: null
      };
    } catch (err) {
      return {
        output: this.output,
        success: false,
        error: err.message
      };
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoidRuntime;
}
