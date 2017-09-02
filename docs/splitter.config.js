/// @ts-check
const path = require("path");

function resolve(filePath) {
  return path.resolve(__dirname, filePath)
}

function runScript(scriptPath) {
  var scriptDir = path.dirname(scriptPath);
  // Delete files in directory from require cache
  Object.keys(require.cache).forEach(function(key) {
    if (key.startsWith(scriptDir))
      delete require.cache[key]
  })
  require(scriptPath);
}

var outFile = resolve("build/Main.js");

module.exports = {
  entry: resolve("DocGenerator.fsproj"),
  outDir: path.dirname(outFile),
  babel: { plugins: ["transform-es2015-modules-commonjs"] },
  fable: { define: ["DEBUG"] },
  postbuild() { runScript(outFile) }
};
