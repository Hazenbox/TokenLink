/**
 * Brand Variant Generator (Layer 8)
 * Generates brand variants (Jio, JS) that alias to Theme
 */

import { BaseLayerGenerator } from './base-layer-generator';
import { VariableEntry } from '@/lib/variable-registry';

const SCALE_NAMES = [
  'Surface',
  'High',
  'Medium',
  'Low',
  'Heavy',
  'Bold',
  'Bold A11Y',
  'Minimal'
] as const;

const TOKEN_CATEGORIES = ['Primary', 'Secondary', 'Accent', 'Surface'] as const;

export class BrandVariantGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const modes = this.layer.modes || ['Jio', 'JS'];
    
    this.log(`Generating Brand Variant variables with ${modes.length} brand variants`);
    
    // Get brand name
    const brandName = this.brand.name || 'Brand';
    
    for (const tokenCategory of TOKEN_CATEGORIES) {
      for (const scale of SCALE_NAMES) {
        const name = `${brandName}/${tokenCategory}/[Brand] ${scale}`;
        
        // Each brand variant aliases to Theme variables
        // Map to the Surfaces category from Theme layer
        const themeName = `${brandName}/Surfaces/[Theme] ${scale}`;
        
        modes.forEach((variant, idx) => {
          // Find Theme variable (use first theme mode - MyJio)
          const themeVars = this.registry.findByCollection('theme')
            .filter(v => v.name === themeName && v.modeName === 'MyJio');
          
          if (themeVars.length === 0) {
            this.warn(`Theme variable not found: ${themeName} (MyJio)`);
            return;
          }
          
          const themeVar = themeVars[0];
          
          variables.push({
            id: this.generateVariableId(),
            name,
            collectionId: this.layer.id,
            collectionName: this.layer.collectionName,
            layer: this.layer.order,
            modeId: `mode_${idx}`,
            modeName: variant,
            aliasToId: themeVar.id,
            aliasToName: themeName,
            metadata: { scale, context: tokenCategory }
          });
        });
      }
    }
    
    this.log(`Generated ${variables.length} brand variant variables`);
    return variables;
  }
}
