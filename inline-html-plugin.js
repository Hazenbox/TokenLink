/**
 * Custom Webpack plugin to inline both HTML and UI JS into the code.js bundle
 * This makes them available for figma.showUI() in the plugin sandbox
 */
class InlineHTMLPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('InlineHTMLPlugin', (compilation) => {
      // Hook into HtmlWebpackPlugin's afterEmit hook
      const HtmlWebpackPlugin = compiler.options.plugins
        .map((plugin) => plugin.constructor)
        .find((constructor) => constructor && constructor.name === 'HtmlWebpackPlugin');

      if (HtmlWebpackPlugin) {
        HtmlWebpackPlugin.getHooks(compilation).afterEmit.tapAsync(
          'InlineHTMLPlugin',
          (data, cb) => {
            // Get the generated HTML and UI JS
            const htmlAsset = compilation.assets['ui.html'];
            const uiJsAsset = compilation.assets['ui.js'];
            const codeAsset = compilation.assets['code.js'];
            
            if (htmlAsset && uiJsAsset && codeAsset) {
              let htmlContent = htmlAsset.source();
              const uiJsContent = uiJsAsset.source();
              
              // Replace the script src reference with inline script
              // Need to escape special regex characters and handle different attribute orders
              htmlContent = htmlContent.replace(
                /<script[^>]*src="ui\.js"[^>]*><\/script>/g,
                `<script>${uiJsContent}</script>`
              );
              
              const originalSource = codeAsset.source();
              const htmlVariable = `var __html__ = ${JSON.stringify(htmlContent)};\n`;
              
              // Create new source with HTML variable prepended
              compilation.assets['code.js'] = {
                source: () => htmlVariable + originalSource,
                size: () => htmlVariable.length + originalSource.length
              };
            }
            
            cb(null, data);
          }
        );
      }
    });
  }
}

module.exports = InlineHTMLPlugin;
