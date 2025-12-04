const path = require('path');

module.exports = {
  entry: {
    'content-bundle': './src/content.js',
    'popup/popup': './popup/popup.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'production',
  resolve: {
    extensions: ['.js']
  }
};

