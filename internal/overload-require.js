const fs = require("fs");
const R = require("ramda");
const log = require("./logger");

const jsExt = ".js";

let whiteList = [];
let shouldTransformFn;

function setWhiteList(wl) {
    whiteList = wl;
    shouldTransformFn = R.anyPass(
        whiteList.map(good => _ => _.indexOf(good) > -1)
    );
}
// initial call
setWhiteList(whiteList);

function enableOhmAndJSTest() {
    if (typeof window === "undefined") {
        const fs = require("fs");
        require.extensions[".ohm"] = require.extensions[".jstest"] = function(
            m,
            fileName
        ) {
            m.exports = fs.readFileSync(fileName).toString();
        };
    }
}

// @pure
function compile(transformFn, filePath) {
    const code = fs.readFileSync(filePath).toString();
    console.log("start transpilation");
    console.time("transpile");
    const retVal = transformFn(code);
    console.timeEnd("transpile");
    return retVal;
}

function loader(transformFn, m, fileName) {
    const compiled = compile(transformFn, fileName);
    // log(compiled);
    log("\n~~~ Executing the code ~~~\n");
    m._compile(compiled, fileName);
}

function registerGrammar(transformFn) {
    const old = require.extensions[jsExt];

    require.extensions[jsExt] = function(m, fileName) {
        const shouldIgnore = !shouldTransformFn(fileName);
        if (false && shouldIgnore) {
            // log("ignoring", fileName);
            old(m, fileName);
        } else {
            log("shouldTransformFn(fileName)", fileName, !shouldIgnore);
            loader(transformFn, m, fileName);
        }
    };
}

// Creates a require-function which will use the provided transform function to compile
// the required code.
// @pure but returns a non-pure function
function createRequireWithTransform(transform) {
    const newRequire = function(m, fileName) {
        loader(transform, m, fileName);
    };
    return function requireFn(path) {
        const old = require.extensions[jsExt];

        const shouldIgnore = !shouldTransformFn(fileName);
        if (!shouldIgnore) {
            require.extensions[jsExt] = newRequire;
            // log("requiring", path, "using", "these grammars:", transform.grammars);
        }

        const retVal = require(path);
        if (!shouldIgnore) {
            require.extensions[jsExt] = old;
        }

        return retVal;
    };
}

module.exports = {
    enableOhmAndJSTest,
    registerGrammar,
    setWhiteList,
    createRequireWithTransform
};
