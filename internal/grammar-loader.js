const R = require("ramda");
const ohm = require("ohm-js");
const { uniquifyGrammar, prefixActionObj } = require("./uniquify");
const transformationHelpers = require("./transformation-helpers");
const { maybe } = require("maybes");

function createGrammarFromString(grammarContent, ns, uniquify) {
    const g = ohm.grammar(grammarContent, ns);
    return uniquifyGrammar(g);
}

function linearizeModules(modules, orderedModuleNames, es6) {
    const { grammar: baseGrammar, semantics: baseSemantics } = es6;
    let currentBaseGrammar = baseGrammar;
    let semantics = baseSemantics;
    const initializeStatements = [];

    let ns = {};
    orderedModuleNames.forEach(moduleName => {
        const savedSemantics = semantics;
        const savedGrammar = currentBaseGrammar;
        const module = modules[moduleName];
        const extension = module.semantics;
        if (extension == null) {
            throw new Error(
                "Could not find semantic extension for " + moduleName
            );
        }
        if (extension.getNamespaceExtension) {
            ns = R.merge(ns, extension.getNamespaceExtension());
        }

        ns.ES6 = currentBaseGrammar;
        currentBaseGrammar = createGrammarFromString(module.grammar, ns);

        const translate = function(code) {
            return savedSemantics(savedGrammar.match(code)).toES5();
        };

        const requireFn = () => {
            throw new Error("requireFn not implemented");
        };

        const actionObj = extension.getActions(translate, requireFn);

        if (extension.initializationStatement) {
            initializeStatements.push(extension.initializationStatement);
        }

        semantics = currentBaseGrammar
            .extendSemantics(semantics)
            .extendOperation(
                "toES5",
                prefixActionObj(currentBaseGrammar, actionObj)
            );

        if (extension.addOperation) {
            const { name, actions } = extension.addOperation();
            semantics.addOperation(
                `${name}`,
                prefixActionObj(currentBaseGrammar, actions)
            );
        }
        if (extension.addOperations) {
            const operations = extension.addOperations();
            operations.forEach(op => {
                const { name, actions } = op;
                semantics.addOperation(
                    `${name}`,
                    prefixActionObj(currentBaseGrammar, actions)
                );
            });
        }

        semantics._getSemantics().operatorToCode = Object.create(
            savedSemantics._getSemantics().operatorToCode
        );
        if (extension.extendOperators) {
            extension.extendOperators(semantics._getSemantics().operatorToCode);
        }

        semantics._getSemantics().associativity = Object.create(
            savedSemantics._getSemantics().associativity
        );
        if (extension.extendAssociativities) {
            extension.extendAssociativities(
                semantics._getSemantics().associativity
            );
        }
    });

    orderedModuleNames.forEach(moduleName => {
        const extension = modules[moduleName].semantics;
        if (extension.receiveFinalGrammar) {
            extension.receiveFinalGrammar(currentBaseGrammar);
        }
    });

    return {
        grammar: currentBaseGrammar,
        semantics,
        initializeStatements
    };
}

module.exports = { createGrammarFromString, linearizeModules };
