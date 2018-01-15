const prefixRuleWith = (n, rule) => n + "$" + rule;

function isRuleBuiltIn(grammar, rule) {
    let currentGrammar = grammar;
    const chain = [currentGrammar];
    while (currentGrammar.superGrammar != null) {
        currentGrammar = currentGrammar.superGrammar;
        chain.push(currentGrammar);
    }
    const builtInGrammars = chain.slice(-2); // there are two built-in grammars
    return builtInGrammars.some(g => g.rules.hasOwnProperty(rule));
}

function findInInheritanceChain(baseGrammar, findFn) {
    const retVal = findFn(baseGrammar);
    if (retVal) {
        return retVal;
    } else if (baseGrammar.superGrammar != null) {
        return findInInheritanceChain(baseGrammar.superGrammar, findFn);
    }
    return null;
}

// Traverses up to the builtin grammar and returns the prefixed rule if found
function findPrefixedRuleInInheritanceChain(ruleName, grammar) {
    if (grammar.isBuiltIn()) {
        return ruleName;
    }

    if (!grammar.wasUniquified) {
        // There is probably no point in going further up
        console.warn("Reached a not uniquified grammar. returning", ruleName);
        return ruleName;
    }

    const prefixedName = prefixRuleWith(grammar.name, ruleName);
    if (grammar.rules[prefixedName]) {
        return prefixedName;
    } else {
        // find out whether this is defined in a super grammar
        return findPrefixedRuleInInheritanceChain(
            ruleName,
            grammar.superGrammar
        );
    }
}

function uniquifyGrammar(grammar) {
    const ruleObj = grammar.rules;
    if (grammar.wasUniquified) {
        return grammar;
    }
    grammar.wasUniquified = true;
    const oldRuleNames = new Set();
    const prefixRuleName = r => prefixRuleWith(grammar.name, r);
    const recRename = ruleBodies => {
        ruleBodies.forEach(rule => {
            if (rule.ruleName != null) {
                // Apply
                const newName = findPrefixedRuleInInheritanceChain(
                    rule.ruleName,
                    grammar
                );
                rule.ruleName = newName;
                recRename(rule.args);
            } else if (rule.terms != null) {
                // Alt | Extend
                recRename(rule.terms);
            } else if (rule.factors != null) {
                // Seq
                recRename(rule.factors);
            } else if (rule.obj != null) {
                // Terminal
                // noop
            } else if (rule.expr != null) {
                // Plus | Star | Not
                recRename([rule.expr]);
            }
        });
    };

    // TODOp: what was the rationale behind checking whether the superGrammar is uniquified?
    if (!grammar.superGrammar.wasUniquified) {
        grammar.defaultStartRule = prefixRuleName(grammar.defaultStartRule);
    }
    Object.keys(ruleObj).forEach(ruleName => {
        if (ruleName.indexOf("$") > -1) {
            // already qualified
            return;
        }
        // if (ruleName.indexOf("space") > -1) {
        //     debugger;
        // }
        // TODOp: this will always return the current grammar, since we are iterating over Object.keys ?
        const owningGrammar = findInInheritanceChain(
            grammar,
            g => g.rules.hasOwnProperty(ruleName) && g
        );

        if (!isRuleBuiltIn(grammar, ruleName)) {
            ruleObj[prefixRuleWith(owningGrammar.name, ruleName)] =
                ruleObj[ruleName];
            oldRuleNames.add(ruleName);
            delete ruleObj[ruleName];
        }
    });
    recRename(Object.values(ruleObj).map(_ => _.body));
    return grammar;
}

function prefixActionObj(grammar, actionObj) {
    Object.keys(actionObj).forEach(rule => {
        if (rule[0] !== "_" && rule.indexOf("$") === -1) {
            let currentGrammar = grammar;
            let qualifiedName;
            while (currentGrammar != null && currentGrammar.wasUniquified) {
                qualifiedName = currentGrammar.name + "$" + rule;
                ruleInfo = currentGrammar.rules[qualifiedName];
                if (ruleInfo != null) {
                    break;
                }
                currentGrammar = currentGrammar.superGrammar;
            }

            if (!qualifiedName) {
                debugger;
                throw new Error(
                    "no qualifiedName found when prefixing action obj"
                );
            }

            actionObj[qualifiedName] = actionObj[rule];
            delete actionObj[rule];
        }
    });
    return actionObj;
}

module.exports = { uniquifyGrammar, prefixActionObj };
