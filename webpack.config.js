const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'www/js'),
    filename: 'index.bundle.js',
  },
  devtool: 'inline-source-map',
};
