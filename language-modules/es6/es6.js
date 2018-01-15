/* eslint-env node */

'use strict';

const {uniquifyGrammar, prefixActionObj} = require("../../internal/uniquify");

// Semantic actions for the `mentionsThis` attribute, which returns true for a node
// if the `this` keyword appears anywhere in the node's subtree, and otherwise false.
var mentionsThisActions = {
  this: function(_) { return true; },
  _terminal: function() { return false; },
  _nonterminal: anyNodesMentionThis,
  _iter: anyNodesMentionThis
};

function anyNodesMentionThis(nodes) {
  return nodes.some(function(n) { return n.mentionsThis; });
}

var toES5Actions = {
  ArrowFunction: function(params, _, arrow, body) {
    var source = 'function ' + params.toES5() + ' ' + body.toES5();
    // Only use `bind` if necessary.
    return body.mentionsThis ? source + '.bind(this)' : source;
  },
  ArrowParameters_unparenthesized: function(id) {
    return '(' + id.toES5() + ')';
  },
  ConciseBody_noBraces: function(exp) {
    return '{ return ' + exp.toES5() + ' }';
  },
  // ClassDeclaration: function(_, className, body) {
  //   return "createClass('" + className.toES5() + "', " + body.toES5() + ");";
  // },
  assignmentOperator_logicalOrAssignment: function(a) {
    console.log(a);
    return {node: a.toES5()};
  }
};


module.exports = function(es6grammar, baseSemantic) {
  var semantics = es6grammar.extendSemantics(baseSemantic);
  prefixActionObj(es6grammar, mentionsThisActions);
  semantics._getSemantics().operatorToCode = Object.create(semantics._getSemantics().super.operatorToCode);
  semantics._getSemantics().associativity = Object.create(semantics._getSemantics().super.associativity);
  semantics.addAttribute('mentionsThis', mentionsThisActions);
  semantics.extendOperation('toES5', prefixActionObj(es6grammar, toES5Actions));

  return {
    semantics: semantics
  };
};
