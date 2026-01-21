const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  devtool: argv.mode === 'production' ? false : 'inline-source-map',

  entry: {
    code: './src/code.ts',
    ui: './src/ui/index.tsx',
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@models': path.resolve(__dirname, 'src/models'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@common': path.resolve(__dirname, 'src/common'),
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui/index.html',
      filename: 'ui.html',
      chunks: ['ui'],
      inject: 'body',
    }),
    // Custom plugin to inline JavaScript into HTML for Figma
    {
      apply: (compiler) => {
        compiler.hooks.compilation.tap('InlineScriptPlugin', (compilation) => {
          HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
            'InlineScriptPlugin',
            (data, cb) => {
              // Replace ALL script tags with src="ui.js" with inline script
              const uiJsAsset = compilation.assets['ui.js'];
              if (uiJsAsset) {
                const jsContent = uiJsAsset.source();
                // Remove all external script references to ui.js
                data.html = data.html.replace(
                  /<script[^>]*src="ui\.js"[^>]*><\/script>/g,
                  ''
                );
                // Add single inline script at the end of body
                data.html = data.html.replace(
                  '</body>',
                  `<script>${jsContent}</script></body>`
                );
              }
              cb(null, data);
            }
          );
        });
      }
    }
  ],
});
