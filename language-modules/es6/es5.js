/* eslint-env node */

'use strict';

// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------
const {uniquifyGrammar, prefixActionObj} = require("../../internal/uniquify");

var fs = require('fs');
var path = require('path');

var ohm = require('ohm-js');

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------

// Take an Array of nodes, and whenever an _iter node is encountered, splice in its
// recursively-flattened children instead.
function flattenIterNodes(nodes) {
  var result = [];
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i]._node.ctorName === '_iter') {
      result.push.apply(result, flattenIterNodes(nodes[i].children));
    } else {
      result.push(nodes[i]);
    }
  }
  return result;
}

// Comparison function for sorting nodes based on their interval's start index.
function compareByInterval(node, otherNode) {
  return node.source.startIdx - otherNode.source.startIdx;
}

function nodeToES5(node, children) {
  var flatChildren = flattenIterNodes(children).sort(compareByInterval);

  // Keeps track of where the previous sibling ended, so that we can re-insert discarded
  // whitespace into the final output.
  var prevEndIdx = node.source.startIdx;

  var code = '';
  for (var i = 0; i < flatChildren.length; ++i) {
    var child = flatChildren[i];

    // Restore any discarded whitespace between this node and the previous one.
    if (child.source.startIdx > prevEndIdx) {
      code += node.source.sourceString.slice(prevEndIdx, child.source.startIdx);
    }
    // child.__parent = node;

    code += child.toES5();
    prevEndIdx = child.source.endIdx;
  }
  return code;
}

// Instantiate the ES5 grammar.
// var contents = fs.readFileSync(path.join(__dirname, 'es5.ohm'));
var contents = require('./es5.ohm');
var es5 = ohm.grammars(contents).ES5;

var g = uniquifyGrammar(es5);
var semantics = g.createSemantics();


function buildPrecedences(precedences) {
  const highestPrec = precedences.length;
  const precedenceObj = {};
  let currentPrec = highestPrec;
  for (const ops of precedences) {
    for (const op of ops) {
      precedenceObj[op] = currentPrec;
    }
    currentPrec--;
  }
  return precedenceObj;
}

const associativity = {
  '+': 'L',
  '-': 'L',
  '*': 'L',
  '/': 'L',
  '**': 'R'
};
// precedence has a structure like: {
//   '+': 0, '-': 0, '*': 1, '/': 1, '**': 2, '~>': -1
// };
const precedence = buildPrecedences([
  ["*", "/", "%"],
  ["+", "-"],
  ["<<", ">>>", ">>"],
  ["<", ">", "<=", ">=", "instanceof", "in"],
  ["==", "!=", "===", "!=="],
  ["&"],
  ["^"],
  ["|"],
  ["&&"],
  ["||"],
  ["|>"],
  ["~>"],
  ["|>>"],
]);

const operatorToCode = {};

const globalMinPrecedence = Math.min(...Object.values(precedence));

class BinaryExpression {
  constructor(operatorToCode, left, op, right) {
    this.operatorToCode = operatorToCode;
    this.left = left;
    this.op = op;
    this.right = right;
  }
  toString() {
    const {left, op, right} = this;
    let handler;
    if (handler = this.operatorToCode[op]) {
      return handler(left, right);
    } else {
      return `${left} ${op} ${right}`;
    }
  }
}

// Modified Richards and Whitby-Stevens precedence climbing method.
function makeTree(associativity, operatorToCode, left, ops, rights, minPrecedence) {
  if (minPrecedence == null) {
    minPrecedence = globalMinPrecedence;
  }

  while (ops.length > 0 && precedence[ops[0]] >= minPrecedence) {
    let op = ops.shift();
    let right = rights.shift();
    // console.log(associativity[ops[0]], ops[0]);
    while (ops.length > 0 && (precedence[ops[0]] > precedence[op] ||
        associativity[ops[0]] === 'R' && precedence[ops[0]] === precedence[op])) {
      right = makeTree(associativity, operatorToCode, right, ops, rights, precedence[ops[0]]);
    }
    left = new BinaryExpression(operatorToCode, left, op, right);
  }
  return left;
}


semantics.addOperation('toES5()', prefixActionObj(g, {
  Program: function(_, sourceElements) {
    // Top-level leading and trailing whitespace is not handled by nodeToES5(), so do it here.
    var sourceString = this.source.sourceString;
    return sourceString.slice(0, this.source.startIdx) +
           nodeToES5(this, [sourceElements]) +
           sourceString.slice(this.source.endIdx);
  },
  _nonterminal: function(children) {
    return nodeToES5(this, children);
  },
  closingBracketLookAhead: function(_) {
    return "";
  },
  _terminal: function() {
    return this.sourceString;
  },
  NonAssignmentExpression(left, op, right) {
    return makeTree(this._semantics.associativity, this._semantics.operatorToCode, left.toES5(), op.toES5(), right.toES5()).toString();
  }
}));

semantics._getSemantics().operatorToCode = operatorToCode;
semantics._getSemantics().associativity = associativity;
// debugger;
module.exports = {
  grammar: g,
  semantics: semantics
};
