const macros = {};

module.exports = {
  addOperation: function() {
    return {
      name: "extractParts()",
      actions: {
        FunctionDeclarationWithoutKeyword: function(name, _, params, _, _, body, _) {
          return {
            name: name.toES5(),
            params: params.toES5(),
            body: body.toES5(),
          };
        },
        Arguments: function(_, args, _) {
          return args.toES5();
        }
      }
    }
  },
  getActions: function() {
    return {
      MacroDeclaration: function (_, nameAndBody) {
        const {name, params, body} = nameAndBody.extractParts();

        macros[name] = function() {
          let output = body;
          params.split(",").forEach((param, idx) => {
            output = output.replace(
              new RegExp(`(^|[^a-zA-Z0-9_])${param.trim()}([^a-zA-Z0-9_]|$)`, "gm"),
              (match, pre, post) => `${pre}${arguments[idx]}${post}`
            );
          });
          return output;
        }
        return "";
      },

      CallExpression_macroInvocation(ident, bang, args) {
        const identName = ident.toES5();
        const macro = macros[identName];
        if (macro) {
          const argEls = args.extractParts().split(", ");
          return macro.apply(macro, argEls).trim();
        } else {
          throw new Error("Couldn't find macro " + identName);
        }
      }
    }
  }
};