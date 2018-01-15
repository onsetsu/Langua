module.exports = {
	grammar: require("./uncertainty.ohm"),
	semantics: require("./uncertainty_semantic.js"),
	test: require("./uncertainty_sample.jstest"),
};