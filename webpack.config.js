const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

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
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tapAsync('InlineUIPlugin', (compilation, callback) => {
          const distPath = path.resolve(__dirname, 'dist');
          const codePath = path.join(distPath, 'code.js');
          const uiPath = path.join(distPath, 'ui.js');
          const templatePath = path.resolve(__dirname, 'src/ui-template.html');
          
          try {
            const template = fs.readFileSync(templatePath, 'utf8');
            const uiCode = fs.readFileSync(uiPath, 'utf8');
            const codeJs = fs.readFileSync(codePath, 'utf8');
            
            const html = template.replace('%%UI_CODE%%', uiCode);
            const finalCode = `var __html__=${JSON.stringify(html)};\n${codeJs}`;
            
            fs.writeFileSync(codePath, finalCode);
            console.log('✓ Inlined ui.js into code.js');
          } catch (err) {
            console.error('Failed to inline UI:', err);
          }
          
          callback();
        });
      }
    }
  ],
});
