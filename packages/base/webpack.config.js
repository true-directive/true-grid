const path = require("path");
const webpack = require("webpack")
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const PATHS = {
  entryPoint: path.resolve(__dirname, 'public_api.ts'),
  bundles: path.resolve(__dirname, 'dist/bundles'),
  dist: path.resolve(__dirname, 'dist')
}

// Вебпак создаст для нас umd модули в папки bundles. Больше ничего.
const config =
{
  entry: {
    // Два бандла (минифицированный и нет)
    'true-directive-base.umd':  [PATHS.entryPoint],
    'true-directive-base.umd.min':  [PATHS.entryPoint]
  },
  output: {
    path: PATHS.bundles,
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'TrueDirectiveBase',
    umdNamedDefine: true
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  devtool: 'source-map',
  optimization: {
    minimize: true,
    // Минифицирует только *.min.js
    minimizer: [new UglifyJsPlugin({
      include: /\.min\.js$/,
      sourceMap: true
    })]
  },
  module: {
    rules: [{
      test: /\.ts?$/,
      exclude: /node_modules/,
      use: [{
        loader: 'awesome-typescript-loader',
        query: {
          declaration: false,
        }
      }]
    }]
  },
  plugins: [
    new CopyWebpackPlugin([
        { from: 'package.json', to: PATHS.dist}
    ])
  ]
}

module.exports = [config];
