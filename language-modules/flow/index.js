module.exports = {
	grammar: require("./flow.ohm"),
	semantics: require("./flow_semantic.js"),
	test: require("./flow_sample.jstest"),
};