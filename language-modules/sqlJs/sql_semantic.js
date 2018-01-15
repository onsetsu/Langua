module.exports = {
  getActions: function() {
    return {
      PrimaryExpression_sqlExpression: function(sql, bracketL, sqlQuery, bracketR) {
        return "sql(`" + sqlQuery.toES5() + "`)";
      }
    };
  }
};