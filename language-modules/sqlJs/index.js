module.exports = {
	grammar: require("./sqlJs.ohm"),
	semantics: require("./sqlJs_semantic.js"),
	test: require("./sqlJs_sample.jstest"),
};