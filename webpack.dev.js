const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'development',
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'www'),
    filename: 'js/index.bundle.js',
    assetModuleFilename: 'css/assets/[hash][ext][query]'
  },
  devServer: {
    static: { 
      directory: path.resolve(__dirname, './www/data'), 
      publicPath: '/data'
    }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/index.bundle.css",
    }),
    new HtmlWebpackPlugin({
      template: 'src/html/index.html'
    }),
    new Dotenv(),
  ],
  module: {
    rules: [
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(ttf|png|svg|jpg)$/,
        type: 'asset/resource',
      }
   ]
  },
};
