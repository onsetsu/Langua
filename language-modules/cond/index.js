module.exports = {
	grammar: require("./cond.ohm"),
	semantics: require("./cond_semantic.js"),
	test: require("./cond_sample.jstest"),
};