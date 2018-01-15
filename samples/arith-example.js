const ohm = require("ohm-js");

const g = ohm.grammar(`
	Arithmetic {
	  AddExpr
	    = AddExpr "+" MulExpr  -- plus
	    | MulExpr

	  MulExpr
	    = MulExpr "*" Number  -- times
	    | Number

	  Number
	    = digit+
	}
`);

const semantics = g.createSemantics().addOperation("eval(base)", {
	AddExpr_plus(a, op, b) {
		const base = this.args.base;
		return a.eval(base) + b.eval(base);
	},

	MulExpr_times(a, op, b) {
		const base = this.args.base;
		return a.eval(base) * b.eval(base);
	},

	Number(digits) {
		return parseInt(digits.sourceString, this.args.base);
	},
});

const match = g.match("10+10*11");
console.log(match);
console.log(semantics(match).eval(2));
