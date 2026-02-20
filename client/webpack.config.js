const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  // Get API URL from environment variable or use default
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  return {
    entry: './src/index.jsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react'],
            },
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: 'body',
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      port: process.env.PORT || 8080,
      open: process.env.OPEN_BROWSER !== 'false',
      hot: true,
      compress: true,
      historyApiFallback: true,
      // Proxy configuration for Flask backend
      proxy: [
        {
          context: ['/socket.io', '/health'],
          target: apiUrl,
          ws: true, // Enable WebSocket proxying for Socket.IO
          changeOrigin: false,
          logLevel: 'debug',
        },
      ],
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
  };
};
