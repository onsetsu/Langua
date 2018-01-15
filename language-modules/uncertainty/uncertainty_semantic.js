module.exports = {
  extendOperators: function(operatorToCode) {
    operatorToCode["+"] = (l, r) => `addUncertainties(${l}, ${r})`;
    operatorToCode["-"] = (l, r) => `subUncertainties(${l}, ${r})`;
    operatorToCode["*"] = (l, r) => `mulUncertainties(${l}, ${r})`;
    operatorToCode["/"] = (l, r) => `divUncertainties(${l}, ${r})`;
  },
  getActions: function(transformer) {
    return {
      PostfixExpression_uncertainty: function(literal, _, delta) {
        // numericLiteral_uncertainty: function(literal, _, delta) {
        return `new UncertainNumber(${literal.toES5()}, ${delta.toES5()})`;
      },
      PrimaryExpression_uncertaintyInitializer: function(_) {
        function calcUncertainties(a, b, op) {
          var isUncertaintyWrapper = a => a instanceof UncertainNumber;

          function fn(a, b) {
            if (op === "+") {
              return a + b;
            } else if (op === "-") {
              return a - b;
            } else if (op === "*") {
              return a * b;
            } else if (op === "/") {
              return a / b;
            }
          }

          if (isUncertaintyWrapper(a) && isUncertaintyWrapper(b)) {
            var newVal = fn(a.val, b.val);
            var newDelta;
            if (op === "+" || op === "-") {
              newDelta = a.delta + b.delta;
            } else {
              var relDeltaA = a.delta / a.val;
              var relDeltaB = b.delta / b.val;
              newDelta = (relDeltaA + relDeltaB) * newVal;
            }

            return new UncertainNumber(newVal, newDelta);
          } else if (isUncertaintyWrapper(a) && !isUncertaintyWrapper(b)) {
            var newVal = fn(a.val, b);
            var newDelta;
            if (op === "+" || op === "-") {
              newDelta = a.delta;
            } else {
              var relDeltaA = a.delta / a.val;
              // why wouldnt this work?
              // var relDeltaB = 0;
              newDelta = relDeltaA * newVal;
            }

            return new UncertainNumber(newVal, newDelta);
          } else if (!isUncertaintyWrapper(a) && isUncertaintyWrapper(b)) {
            var newVal = fn(a, b.val);
            var newDelta;
            if (op === "+" || op === "-") {
              newDelta = b.delta;
            } else {
              var relDeltaB = b.delta / b.val;
              newDelta = relDeltaB * newVal;
            }

            return new UncertainNumber(newVal, newDelta);
          } else {
            // this also includes cases, where a or b are neither numbers nor uncertainty wrappers
            return fn(a, b);
          }
        }

        function addUncertainties(a, b) {
          return calcUncertainties(a, b, "+");
        }

        function subUncertainties(a, b) {
          return calcUncertainties(a, b, "-");
        }

        function mulUncertainties(a, b) {
          return calcUncertainties(a, b, "*");
        }

        function divUncertainties(a, b) {
          return calcUncertainties(a, b, "/");
        }

        function UncertainNumber(val, delta) {
          this.val = val;
          this.delta = delta;
          this.format = function(unit) {
            var val = this.val.format ? this.val.format(unit) : this.val;
            var delta = this.delta.format
              ? this.delta.format(unit)
              : this.delta;
            return val + " +- " + delta;
          };
        }
        const initCode = [
          calcUncertainties,
          addUncertainties,
          subUncertainties,
          mulUncertainties,
          divUncertainties,
          UncertainNumber
        ]
          .map(el => el.toString())
          .join(";");

        return transformer(initCode);
      }
    };
  },
  initializationStatement: "'UncertaintyInitializer'"
};
