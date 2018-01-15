const ohm = require('ohm-js');
const { uniquifyGrammar } = require("../../internal/uniquify");
const es5 = require("./es5");
const es6 = require("./es6");

const es6ohmContent = require('./es6.ohm');
const ES6Grammar = uniquifyGrammar(ohm.grammar(es6ohmContent, { ES5: es5.grammar }));

const es6semantics = es6(ES6Grammar, es5.semantics).semantics;

module.exports = {
	grammar: ES6Grammar,
	semantics: es6semantics
};