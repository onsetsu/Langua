const fs = require("fs");
const overloadRequire = require("./internal/overload-require.js");
// Should be loaded before other internal modules
overloadRequire.enableOhmAndJSTest();

const transformationHelpers = require("./internal/transformation-helpers");
const runTests = require("./internal/test-suite");

var Langua = {
	createCompileFunction: (modules, combinationTests, optionalDependencies) => {
		return transformationHelpers.createTransformerFromModules(
			modules,
			combinationTests,
			optionalDependencies
		);
	},
	registerCompileFunction: compileFn => {
		// overloadRequire.setWhiteList(...);
		overloadRequire.registerGrammar(compileFn);
	}
};

module.exports = Langua;
