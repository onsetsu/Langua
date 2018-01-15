module.exports = {
  getActions: function() {
    return {
      MemberExpression_propRefExpCondBang: function(left, /*sth,*/ op, right) {
        return `opt(${left.toES5()}, (el) => el.${right.toES5()})`;
      }
      ,
      CallExpression_propRefExpCondBang: function(left, op, right) {
        return `opt(${left.toES5()}, (el) => el.${right.toES5()})`;
      }
    };
  }
};