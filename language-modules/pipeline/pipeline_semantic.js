module.exports = {
  extendOperators: function(operatorToCode) {
  	// a |> b should be b(a)
    operatorToCode["|>"] = (left, right) => `${right}(${left})`;
  },
  extendAssociativities: function(associativities) {
  	// a |> b |> c should be equal to ((a |> b) |> c)
    associativities["|>"] = "L";
  },
  getActions: function() {
    return {};
  }
};