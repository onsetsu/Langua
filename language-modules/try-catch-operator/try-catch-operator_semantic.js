module.exports = {
	extendOperators: function(operatorToCode) {
	  operatorToCode["~>"] = (left, right) => `(() => { try { return ${left} } catch (ex) { return ${right} } })()`;
	},
	extendAssociativities: function(associativities) {
		associativities["~>"] = "L";
	},
	getActions: () => ({})
};