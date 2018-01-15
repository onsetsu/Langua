require("colors");
const readline = require("readline");

const originalConsole = console.log;
function deactivateConsole() {
	console.log = function() {};
}

function restoreConsole() {
	console.log = originalConsole;
}

if (process.stdout == undefined) {
	process.stdout = { write: console.log.bind(console) };
	readline.cursorTo = () => {};
}

function runTests(modules, transformFn) {
	// global.log = false;
	Object.keys(modules).forEach(moduleName => {
		process.stdout.write("  ..    " + moduleName);

		// deactivateConsole();
		try {
			const fn = new Function(transformFn(modules[moduleName].test));
			fn();
			// require(`../language-modules/${moduleName}/${moduleName}_sample.js`);
			readline.cursorTo(process.stdout, 0);
			ok();
		} catch (ex) {
			readline.cursorTo(process.stdout, 0);
			error(ex);
		}
		// restoreConsole();
		process.stdout.write(`${moduleName}\n`);
	});
	global.log = true;
}

function ok(r) {
	process.stdout.write("[ ");
	process.stdout.write("OK".green);
	process.stdout.write(" ]  ");
	return r;
}

function error(e) {
	process.stdout.write(" [ ");
	process.stdout.write(e.toString().red);
	process.stdout.write(" ]  ");
}

module.exports = {
	runTests,
	restoreConsole,
	deactivateConsole
};
