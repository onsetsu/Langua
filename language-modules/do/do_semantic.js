module.exports = {
  addOperations: function() {
    return [
     {
      name: "toExpression()",
      actions: {
        Block: function(_, statementList, _) {
          return statementList.toExpression();
        },
        StatementList: function(statements) {
          if (statements.children.length === 0) {
            return "undefined";
          } else if (statements.children.length === 1) {
            return statements.children[0].toExpression();
          } else {
            const lastStmt = statements.children[statements.children.length - 1];
            const compiledStatements = [];
            statements.children.forEach((stmt, index) => {
              if (index < statements.children.length - 1) {
                compiledStatements.push(stmt.toES5());
              } else {
                compiledStatements.push(`return ${stmt.toExpression()}`);
              }
            });

            return `(() => {
              ${compiledStatements.join("\n")}
            })()`;
          };
        },
        IfStatement: function(_, _, cond, _, stmt, $else, elStatement) {
          let elseBranch = "undefined";
          if (elStatement.children.length > 0) {
            elseBranch = elStatement.toExpression();
          }
          return `${cond.toES5()} ? ${stmt.toExpression()} : ${elseBranch}`;
        },
        ExpressionStatement: function(exp, _) {
          return exp.toES5();
        }
      }
    }]
  },
  getActions: function() {
    return {
      DoExpression_block: function(_, block) {
        return block.toExpression();
      },
      DoExpression_stmts: function(_, stmts) {
        return stmts.toExpression();
      }
    };
  }
}