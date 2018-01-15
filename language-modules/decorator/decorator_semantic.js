const genericToSource = require("../../misc/genericToSource");

const decoratorStack = [];

module.exports = {
  addOperations: function() {
    return [
      {
        name: "toMemberName()",
        actions: {
          FunctionDeclarationWithoutKeyword: function(name, _, _, _, _, _, _) {
            return name.toES5();
          },
        },
      },
      {
        name: "toTooltip()",
        actions: {
          Program: function(_, sourceElements) {
            return genericToSource(this, [sourceElements], node => node.toTooltip()).trim();
          },
          _nonterminal: function(children) {
            return genericToSource(this, children, node => node.toTooltip()).trim();
          },
          _terminal: function() {
            return "";
          },
          Decorator: function(decorator, member) {
            const { startIdx, endIdx } = this.source;
            return `${startIdx}:${endIdx} I'm a decorator!`;
          },
        },
      },
    ];
  },
  getActions: function() {
    return {
      DecoratedClassMember: function(decorator, member) {
        decoratorStack[decoratorStack.length - 1].push({
          decoratorName: decorator.toES5(),
          memberName: member.toMemberName(),
        });
        return member.toES5();
      },
      Decorator: function(at, ident) {
        return ident.toES5();
      },
      ClassDeclaration: function(_, name, _, body, _) {
        decoratorStack.push([]);
        const cBody = body.toES5();
        const decorators = decoratorStack.pop();
        const cName = name.toES5();

        const decoratorCode = decorators
          .map(decInfo => {
            return `Object.defineProperty(
            ${cName}.prototype,
            "${decInfo.memberName}",
            ${decInfo.decoratorName}(
              ${cName}.prototype,
              "${decInfo.memberName}",
              Object.getOwnPropertyDescriptor(${cName}.prototype, "${decInfo.memberName}")
            )
          )`;
          })
          .join(";\n");

        return `var ${cName} = (function() {
          class ${cName} {
            ${cBody}
          }
          ${decoratorCode}
          return ${cName};
        })();`;
      },
    };
  },
};
