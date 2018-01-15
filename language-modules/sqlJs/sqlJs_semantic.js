const { createGrammarFromString } = require("../../internal/grammar-loader");
let sqlParamGrammar;

module.exports = {
  getActions: function() {
    return {
      PrimaryExpression_sqlExpression: function(a, b, query, d) {
        return `sql(\`${query.toES5()}\`)`;
      },
      Sql$ident_default: function(a, b) {
        const ident = this.sourceString;
        return `\${typeof ${ident} !== 'undefined' ? ${ident} : "${ident}"}`;
      }
    };
  },
  getNamespaceExtension: function() {
    const sql = createGrammarFromString(require('./sql.ohm'));
    sqlParamGrammar = createGrammarFromString(
        require('./sql-param.ohm'),
        // './language-modules/sqlJs/sql-param',
        { Sql: sql }
    );
    return { SqlParam: sqlParamGrammar, Sql: sql };
  },
  receiveFinalGrammar: function(g) {
    sqlParamGrammar.namespace.ForeignExpression = g;
  }
};