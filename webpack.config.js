var path = require("path");
var webpack = require("webpack");

function resolve(filePath) {
  return path.join(__dirname, filePath)
}

function getSamples() {
  var samples = require(resolve("public/samples.json"));
  for (var key in samples) {
    // Resolve relative paths
    samples[key] = resolve(samples[key])
  }
  return samples;
}

var babelOptions = {
  presets: [["es2015", { "modules": false }]],
  plugins: ["transform-runtime"]
};

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
