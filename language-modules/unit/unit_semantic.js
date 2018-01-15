var Qty = require("js-quantities");
global.Qty = Qty;

module.exports = {
  extendOperators: function(operatorToCode) {
    operatorToCode["+"] = (l, r) => `addUnits(${l}, ${r})`;
    operatorToCode["-"] = (l, r) => `subUnits(${l}, ${r})`;
    operatorToCode["*"] = (l, r) => `mulUnits(${l}, ${r})`;
    operatorToCode["/"] = (l, r) => `divUnits(${l}, ${r})`;
  },
  requirements: {
    needs: [],
    shouldBeBefore: [], // "uncertainty"
    shouldBeAfter: [],
    conflictsWith: []
  },
  getActions: function(transformer, requireFn) {
    return {
      numericLiteral_unit: function(literal, _, unit) {
        unit = unit.toES5().replace("$", "dollar");
        return `Qty(${literal.toES5()}, "${unit}")`;
      },
      PrimaryExpression_unitInitializer: function(_) {
        // var Qty = requireFn('js-quantities');
        // use normal require for performance reasons

        function calcUnits(a, b, op) {
          var isUnitWrapper = a =>
            a != null && typeof Qty === "function" && a instanceof Qty;

          var fn, invFn, rawFn;
          if (op === "+") {
            fn = function(a, b) {
              return a.add(b);
            };
            invFn = function(a, b) {
              return b.add(a);
            };
            rawFn = function(a, b) {
              return a + b;
            };
          } else if (op === "-") {
            fn = function(a, b) {
              return a.sub(b);
            };
            // a - b == -b + a
            invFn = function(a, b) {
              return Qty(1).mul(b).add(a);
            };
            rawFn = function(a, b) {
              return a - b;
            };
          } else if (op === "*") {
            fn = function(a, b) {
              return a.mul(b);
            };
            invFn = function(a, b) {
              return b.mul(a);
            };
            rawFn = function(a, b) {
              return a * b;
            };
          } else if (op === "/") {
            fn = function(a, b) {
              return a.div(b);
            };
            // a / b == 1/b * a
            invFn = function(a, b) {
              return Qty(1).div(b).mul(a);
            };
            rawFn = function(a, b) {
              return a / b;
            };
          }

          if (isUnitWrapper(a) && isUnitWrapper(b)) {
            return fn(a, b);
          } else if (isUnitWrapper(a) && !isUnitWrapper(b)) {
            console.warn("calculating with unit and non-unit");
            return fn(a, b);
          } else if (!isUnitWrapper(a) && isUnitWrapper(b)) {
            console.warn("calculating with non-unit and unit. Using invFn");
            return invFn(a, b);
          } else {
            // this also includes cases, where a or b are neither numbers nor unit wrappers
            return rawFn(a, b);
          }
        }

        function addUnits(a, b) {
          return calcUnits(a, b, "+");
        }

        function subUnits(a, b) {
          return calcUnits(a, b, "-");
        }

        function mulUnits(a, b) {
          return calcUnits(a, b, "*");
        }

        function divUnits(a, b) {
          return calcUnits(a, b, "/");
        }

        const highLevelInit = `
          var Qty = typeof require !== "undefined" ? require('js-quantities') : (typeof window !== "undefined" ? window.Qty : global.Qty);
          if (Qty == undefined) {
            throw new Error("Didn't find Qty. Require failed and window/global doesn't provide Qty, either.");
          }
          var toFixedFormatter = function(fixedCount) {
            return function(scalar, units) {
              return scalar.toFixed(fixedCount) + ' ' + units;
            };
          };

          Qty.formatter = toFixedFormatter(2);
        `;
        const initCode = [
          highLevelInit,
          calcUnits,
          addUnits,
          subUnits,
          mulUnits,
          divUnits
        ]
          .map(el => el.toString())
          .join(";");
        return transformer(initCode);
      }
    };
  },
  initializationStatement: "'UnitInitializer'"
};
