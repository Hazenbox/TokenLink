/**
 * Custom Webpack plugin to inline the generated HTML into the code.js bundle
 * This makes the HTML available as the __html__ variable for figma.showUI()
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
            // Get the generated HTML content
            const htmlContent = compilation.assets['ui.html'].source();
            
            // Find the code.js asset and prepend the HTML as a variable
            const codeAsset = compilation.assets['code.js'];
            if (codeAsset) {
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
