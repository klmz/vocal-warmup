const debug = true;
exports.log = (args) => {
    if (!debug) return;
    console.log(args);
}

exports.warn = (args) => {
    if (!debug) return;
    console.warn(args);
}

exports.error = (args) => {
    if (!debug) return;
    console.err(args);
}