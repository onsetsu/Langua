module.exports = {
	grammar: require("./flatmap-operator.ohm"),
	semantics: require("./flatmap-operator_semantic.js"),
	test: require("./flatmap-operator_sample.jstest"),
};