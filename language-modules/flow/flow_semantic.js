const decoratorStack = [];

module.exports = {
  getActions: function() {
    return {
      Expression_typed: function(exp, _, _) {
        return exp.toES5();
      },
      TypeImpl: function(_) {
        return "";
      },
      FormalParameter_typed: function(id, _ , _) {
        return id.toES5();
      },
      TypeDeclaration: function(_, _, _, _) {
        return "";
      },
    }
  }
};