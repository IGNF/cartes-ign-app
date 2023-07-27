const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'www/js'),
    filename: 'index.bundle.js',
  },
};
