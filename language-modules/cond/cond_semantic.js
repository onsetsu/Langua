module.exports = {
  getActions: function(transformer) {
    return {
      MemberExpression_condAccess: function(left, op, right) {
        // a        ?.         b
        // left     op         right
        // return: opt(a, (el) => el.b)
        return `opt(${left.toES5()}, (el) => el.${right.toES5()})`;
      },
      MemberExpression_arrayRefExpCond: function(left, lbrace, exp, rbrace) {
        return `opt(${left.toES5()}, (el) => el[${exp.toES5()}])`;
      },
      CallExpression_condAccess: function(left, op, right) {
        return `opt(${left.toES5()}, (el) => el.${right.toES5()})`;
      },
      PrimaryExpression_condAccessInitializer: function(_) {
        function opt(a, b) {
          if (a != null) {
            return b(a);
          }
        }
        return transformer(opt.toString());
      }
    };
  },
  initializationStatement: "'CondAccessInitializer'"
};