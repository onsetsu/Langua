const operatorNameMap = {
	"+": "Plus",
	"-": "Minus",
}

module.exports = {
  extendOperators: function(operatorToCode) {
  	Object.keys(operatorNameMap).forEach(k => {
  		operatorToCode[k] = (left, right) => `operator${operatorNameMap[k]}(${left}, ${right})`;
  	})
  },
  getActions: function(transformer, requireFn) {
    return {
    	PrimaryExpression_operatorOverloadingInitializer: function(_) {
    		const operatorFunctions = Object.keys(operatorNameMap).map(k =>
    			`function operator${operatorNameMap[k]}(left, right) {
	    			if (left && left[Symbol.operators["${k}"]]) {
	    				return left[Symbol.operators["${k}"]](right);
	    			} else {
	    				return left ${k} right;
	    			}
	    		}`
    		).join("\n");

    		return transformer(`
	    		Symbol.operators = {
	    			"+": Symbol("operator+"),
	    			"-": Symbol("operator-"),
	    		}

	    		${operatorFunctions}
	    	`);
    	}
    };
  },
  initializationStatement: "'OperatorOverloader'"
};