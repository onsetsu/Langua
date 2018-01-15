module.exports = {
	grammar: require("./pipeline.ohm"),
	semantics: require("./pipeline_semantic.js"),
	test: require("./pipeline_sample.jstest"),
};