const path = require('path');

module.exports = {
  entry: './src/renderer.tsx',
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-typescript']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'renderer.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'development'
};