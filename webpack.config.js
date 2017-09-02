var fs = require("fs");
var path = require("path");
var webpack = require("webpack");
var fableUtils = require("fable-utils");
var json5 = require("json5");

function resolve(filePath) {
  return path.join(__dirname, filePath)
}

function getSamples() {
  var samples =  {};
  var categories = json5.parse(fs.readFileSync(resolve("public/samples.json5")));
  for (var key in categories) {
    for (var key2 in categories[key]) {
      samples[key2] = path.join(__dirname, "src", key2, categories[key][key2].entry)
    }
  }
  return samples;
}

var babelOptions = fableUtils.resolveBabelOptions({
  presets: [["es2015", { "modules": false }]],
  plugins: [["transform-runtime", {
    helpers: true,
    polyfill: false,
    regenerator: false
  }]]
});

var isProduction = process.argv.indexOf("-p") >= 0;
console.log("Bundling for " + (isProduction ? "production" : "development") + "...");

module.exports = {
  devtool: "source-map",
  entry: getSamples(),
  output: {
    filename: "[name]/bundle.js",
    path: resolve('public'),
    publicPath: '/'
  },
  resolve: {
    alias: {
      // This is necessary to compile Vue templates on the fly
      // See https://github.com/vuejs-templates/webpack/issues/215
      vue: 'vue/dist/vue.js'
    },
    modules: [
      "node_modules", resolve("node_modules")
    ]
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM",
    "PIXI": "PIXI",
    "three": "THREE",
    "redux": "Redux",
    "queue": "queue",
    "topojson": "topojson",
    "d3": "d3"
  },
  devServer: {
    contentBase: resolve('public'),
    port: 8080
  },
  module: {
    rules: [
      {
        test: /\.fs(x|proj)?$/,
        use: {
          loader: "fable-loader",
          options: {
            babel: babelOptions,
            define: isProduction ? [] : ["DEBUG"]
          }
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions
        },
      }
    ]
  }
};
