let tickCounter = 0;
global.trace = function (type) {
    if (global.shouldLog)
        console.log("trace:", type, tickCounter++);
    if (tickCounter === 167) {
        debugger;
    }
}
global.log = false;
function log() {
    if (global.log) {
        console.log.apply(console, arguments);
    }
}

module.exports = log;