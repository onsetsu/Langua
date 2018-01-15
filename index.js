const Langua = require("./Langua");
const fs = require("fs");

const modules = {
  cond: require("./language-modules/cond"),
  decorator: require("./language-modules/decorator"),
  do: require("./language-modules/do"),
  "flatmap-operator": require("./language-modules/flatmap-operator"),
  jsx: require("./language-modules/jsx"),
  pipeline: require("./language-modules/pipeline"),
  "try-catch-operator": require("./language-modules/try-catch-operator"),
  "operator-overloading": require("./language-modules/operator-overloading"),
  macro: require("./language-modules/macro"),
  flow: require("./language-modules/flow"),
  uncertainty: require("./language-modules/uncertainty"),
  unit: require("./language-modules/unit"),
  sqlJs: require("./language-modules/sqlJs")
};

const combinationTests = [
  {
    modules: ["uncertainty", "unit"],
    test: `
      const sum = 3km+-4km + 5km+-3km;
      if (sum.val.scalar !== 8 || sum.delta.scalar !== 7)
        throw new Error("Wrong result");
    `
  }
];

// If these explicit dependencies are passed, Langua does not
// derive them on its own to save time.
const optionalDependencies = [["unit", "uncertainty"]];

if (typeof window === "undefined") {
  const fileName = "./language-modules/cond/cond_sample.js";
  const transformFn = Langua.createCompileFunction(
    modules,
    combinationTests,
    optionalDependencies
  );

  Langua.registerCompileFunction(transformFn);
  console.log("Executing", fileName);
  require(fileName);
} else {
  Langua.modules = modules;
  Langua.combinationTests = combinationTests;
  window.Langua = Langua;
}

//# sourceURL=index.js
