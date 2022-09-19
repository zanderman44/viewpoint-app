const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './frontend-js/main.js',
  output: {
    filename: 'main-bundled.js',
    path: path.resolve(__dirname, 'public')
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    fallback: {
      fs: false,
      'crypto': require.resolve('crypto-browserify'),
      'zlib': require.resolve('browserify-zlib'),
      'querystring': require.resolve('querystring-es3'),
      'assert': require.resolve('assert/'),
      'stream': require.resolve('stream-browserify'),
      'util': require.resolve('util/'),
      'os': require.resolve('os-browserify/browser'),
      'timers': require.resolve('timers-browserify'),
      'url': require.resolve('url/'),
      'path': require.resolve('path-browserify'),
      'console': require.resolve('console-browserify'),
      'http': require.resolve('stream-http')      
    }
  }
}