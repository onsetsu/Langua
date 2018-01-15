module.exports = {
	extendOperators: function(operatorToCode) {
	  operatorToCode["|>>"] = (left, right) => `${left}.then(${right})`;
	},
	extendAssociativities: function(associativities) {
		associativities["|>>"] = "L";
	},
	getActions: () => ({})
};