// An experiment in representing an expression language four different ways in Ohm.

'use strict';

const ohm = require('ohm-js');

// The expression language is the classic arithmetic operators over integer literals
// and identifiers, which, in EBNF, is:
//
//   E -> E ("+" | "-") T | T             (left associative additive operators)
//   T -> T ("*" | "/") F | F             (left associative multiplicative operators)
//   F -> P "**" F | P                    (right associative exponentiation operator)
//   P -> num | id | "(" E ")"

// Our experiment will consist of four different Ohn grammars and associated semantics
// to produce an AST. The AST prints like a Lisp S-Expression. These are the classes that
// define the AST:

class Program {
  constructor(expression) {this.body = expression;}
  toString() {return this.body.toString();}
}

class BinaryExpression {
  constructor(left, op, right) {
    this.left = left;
    this.op = op;
    this.right = right;
  }
  toString() {
    if (this.op === "~>") {
      return `function() {
        try {
          return ${this.left};
        } catch (exc) {
          return ${this.right});
        }
      )()`;
    } else {
      return `(${this.left} ${this.op} ${this.right})`;
    }
  }
}

class IntegerLiteral {
  constructor(value) {this.value = value;}
  toString() {return `${this.value}`;}
}

class Identifier {
  constructor(name) {this.name = name;}
  toString() {return this.name;}
}

const associativity = {'+': 'L', '-': 'L', '*': 'L', '/': 'L', '**': 'R', '~>': 'L'};
const precedence = {'+': 0, '-': 0, '*': 1, '/': 1, '**': 2, '~>': -1};

const grammar4 = ohm.grammar(`ExpressionLanguage {
  Program = Exp ~any
  Exp     = Primary (binop Primary)*
  Primary = "(" Exp ")"  --parens
          | number
          | id
  binop   = "+" | "-" | "**" | "*" | "/" | "~>"
  id      = letter alnum*
  number  = digit+
}`);

const semantics4 = grammar4.createSemantics().addOperation('tree', {
  Program(body) {return new Program(body.tree());},
  Exp(left, op, right) {return makeTree(left.tree(), op.tree(), right.tree());},
  Primary_parens(open, expression, close) {return expression.tree();},
  number(chars) {return new IntegerLiteral(+this.sourceString);},
  id(char, moreChars) {return new Identifier(this.sourceString);},
  _terminal() {return this.sourceString;}
});

const globalMinPrecedence = Math.min(...Object.values(precedence));

// Modified Richards and Whitby-Stevens precedence climbing method.
function makeTree(left, ops, rights, minPrecedence) {
  if (minPrecedence == null) {
    minPrecedence = globalMinPrecedence;
  }

  while (ops.length > 0 && precedence[ops[0]] >= minPrecedence) {
    let op = ops.shift();
    let right = rights.shift();
    while (ops.length > 0 && (precedence[ops[0]] > precedence[op] ||
        associativity[ops[0]] === 'R' && precedence[ops[0]] === precedence[op])) {
      right = makeTree(right, ops, rights, precedence[ops[0]]);
    }
    left = new BinaryExpression(left, op, right);
  }
  return left;
}

const code = `
  1**2**3 + 4 ~> 3 + 4
`;

const matched = grammar4.match(code);

if (matched.failed()) {
    console.warn("### Code could not be parsed :( ###");
}

const compiled = semantics4(matched).tree();
console.log(compiled.toString());