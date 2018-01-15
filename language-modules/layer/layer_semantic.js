module.exports = {
  addOperation: function() {
  	return {
  		name: "toObject()",
  		actions: {
			ClassDeclaration: function(_, className, _, body, _) {
				return "{" + body.toES5() + "}";
			}
  		},
  	};
  },
  getActions: function() {
    return {
      LayerDeclaration: function(_, layerName, bracketL, _extends, classDeclarations, bracketR) {
        return "createLayer('" + layerName.toES5() + "', " + classDeclarations.toObject() + ")";
      }
    };
  }
};