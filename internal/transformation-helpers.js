const R = require("ramda");
const { linearizeModules } = require("./grammar-loader");
const es6 = require("../language-modules/es6");
const log = require("./logger");
const tsort = require("../misc/tsort");
const { deactivateConsole, restoreConsole } = require("./test-suite");

function createTransformerFromModules(
    modules,
    combinationTests,
    optionalDependencies
) {
    const orderedModuleNames = determineOrder(
        modules,
        combinationTests,
        optionalDependencies
    );
    console.log("Modules will be loaded in this order: ", orderedModuleNames);
    return linearizeAndBuildTransformer(modules, orderedModuleNames);
}

function linearizeAndBuildTransformer(modules, orderedModuleNames) {
    const {
        grammar: linGrammar,
        semantics: linSemantics,
        initializeStatements
    } = linearizeModules(modules, orderedModuleNames, es6);

    return transformWithAll.bind(
        null,
        linGrammar,
        linSemantics,
        initializeStatements
    );
}

function executeTestsWithCompileFn(modules, [moduleA, moduleB], runTestFn) {
    const compileFn = linearizeAndBuildTransformer(
        {
            [moduleA]: modules[moduleA],
            [moduleB]: modules[moduleB]
        },
        [moduleA, moduleB]
    );
    try {
        deactivateConsole();
        runTestFn(compileFn);
        restoreConsole();
        return true;
    } catch (ex) {
        restoreConsole();
        return false;
    }
}

function registerRequirements(
    edges,
    a,
    b,
    doesOrderASucceed,
    doesOrderBSucceed
) {
    if (!doesOrderASucceed || !doesOrderBSucceed) {
        if (!doesOrderASucceed) {
            // Register that B should be before A
            edges.push([b, a]);
        }
        if (!doesOrderBSucceed) {
            // Register that A should be before B
            edges.push([a, b]);
        }
    }
}

function determineOrder(modulesObj, combinationTests, optionalDependencies) {
    const modules = Object.keys(modulesObj).sort();
    const edges =
        optionalDependencies || computeDependencies(modules, combinationTests);

    console.log("Dependencies: ", edges);
    const sorted = R.intersection(tsort(edges), modules);
    const missingModules = R.difference(modules, sorted);
    return sorted.concat(missingModules);
}

function computeDependencies(modules, combinationTests) {
    const edges = [];
    const tuples = R.xprod(modules, modules).filter(([a, b]) => a < b);

    tuples.forEach(([a, b]) => {
        console.log("Check dependencies between", a, "and", b);
        const runTestFn = compileFn => {
            new Function(compileFn(modulesObj[a].test))();
            new Function(compileFn(modulesObj[b].test))();
        };
        const doesOrderASucceed = executeTestsWithCompileFn(
            modulesObj,
            [a, b],
            runTestFn
        );
        const doesOrderBSucceed = executeTestsWithCompileFn(
            modulesObj,
            [b, a],
            runTestFn
        );

        registerRequirements(edges, a, b, doesOrderASucceed, doesOrderBSucceed);
    });

    combinationTests.forEach(combinationTest => {
        if (combinationTest.modules.length !== 2) {
            throw new Error(
                "Combination tests for more than two modules are not supported at this point."
            );
        }

        const [a, b] = combinationTest.modules;

        if (!(a in modulesObj || b in modulesObj)) {
            return;
        }

        console.log("Run combinationTest for", a, b);

        const doesOrderASucceed = executeTestsWithCompileFn(
            modulesObj,
            [a, b],
            compileFn => {
                new Function(compileFn(combinationTest.test))();
            }
        );
        const doesOrderBSucceed = executeTestsWithCompileFn(
            modulesObj,
            [b, a],
            compileFn => {
                new Function(compileFn(combinationTest.test))();
            }
        );

        registerRequirements(edges, a, b, doesOrderASucceed, doesOrderBSucceed);
    });

    return edges;
}

// @pure
function transformWithAll(grammar, semantics, initializeStatements, code) {
    log("### Starting translation ###\n");
    log(code.slice(0, 50) + "...");

    code =
        initializeStatements.filter(c => c !== "").join("; ") +
        ";\n//###init-code###\n" +
        code;
    global.shouldLog = false;
    const matched = grammar.match(code);

    if (matched.failed()) {
        console.warn("### Code could not be parsed :( ###");
        const msg = prettyPrintFailedMatch(matched);
        const err = new Error("Couldn't be parsed");
        err.msg = msg;
        throw err;
        // return "";
    }

    global.shouldLog = false;
    const matchedSemantics = semantics(matched);
    const retVal = matchedSemantics.toES5();

    log("\n!!! Successful transpilation! !!!\n");
    log(retVal + "\n");
    return retVal;
}

// @pure
function prettyPrintFailedMatch(matched) {
    const failurePosition = matched.getRightmostFailurePosition();
    const offset = 40;
    const leftLineBreak = matched.input.lastIndexOf("\n", failurePosition);
    const rightLineBreak = matched.input.indexOf("\n", failurePosition);
    const right = Math.min(failurePosition + offset, rightLineBreak);
    const left = Math.max(failurePosition - offset, leftLineBreak);

    const failureSurrounding = matched.input.slice(left, right);

    return [
        failureSurrounding,
        " ".repeat(failurePosition - left - 1) + "^ Expected: ",
        matched.getExpectedText()
    ].join("\n");
}

module.exports = { transformWithAll, createTransformerFromModules };
