module.exports = {
  getActions: function() {
    return {
      PrimaryExpression_jsxExpression: function(a) {
        return a.toES5();
      },
      Element_withContent: function(_, name, attributes, _, content, _, _, _, _) {
        return `createElement("${name.toES5()}", ${attributes.toES5()}, ${content.toES5()})`
      },
      Element_withoutContent: function(_, name, attributes, _, _) {
        return `createElement("${name.toES5()}", ${attributes.toES5()})`
      },
      Content_elements: function(elements) {
        if (elements.children.length === 0) {
          return null;
        }
        return elements.toES5();
      },
      Content_text: function(text) {
        return `"${text.toES5()}"`;
      },
      Attributes: function(attrs) {
        if (attrs.length === 0) {
          return null;
        } else {
          const attrStrings = [];
          attrs.children.forEach(attr => {
            const prop = attr.toES5();
            attrStrings.push(prop[0] + ": " + prop[1]);
          });
          return `{${attrStrings.join(", ")}}`;
        }
      },
      Attribute: function(id, maybeEq, maybeVal) {
        if (maybeVal.children.length > 0) {
          return [
            id.toES5(), maybeVal.children[0].toES5()
          ];
        } else {
          return [
            id.toES5(), true
          ];
        }
      },
      JsxJSExpression: function(l, exp, r) {
        return exp.toES5();
      }
    };
  }
};
