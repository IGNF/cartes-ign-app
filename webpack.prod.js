/* eslint-disable license-header/header */
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const MinimizerPlugin = require("minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const PreloadWebpackPlugin = require("@vue/preload-webpack-plugin");
const Dotenv = require("dotenv-webpack");


module.exports = {
  mode: "production",
  entry: "./src/js/index.js",
  output: {
    path: path.resolve(__dirname, "www"),
    filename: "js/index.bundle.js",
    assetModuleFilename: "css/assets/[hash][ext][query]"
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/index.bundle.css",
    }),
    new HtmlWebpackPlugin({
      template: "src/html/index.html"
    }),
    new PreloadWebpackPlugin({
      rel: "prefetch",
      as: "image",
      include: "allAssets",
      fileWhitelist: [/\.(png|jpe?g|gif|svg)$/],
      includeHtmlNames: ["index.html"],
    }),
    new Dotenv(),
  ],
  module: {
    rules: [
      {
        test: /\.(?:js|mjs|cjs)$/,
        include: path.resolve(__dirname, "src"),
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { targets: {
                "ios": "13"
              }}]
            ]
          }
        }
      },
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader"
        ]
      },
      {
        test: /\.(ttf|png|svg|jpg)$/,
        type: "asset/resource",
      },
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [new MinimizerPlugin()],
  },
};
