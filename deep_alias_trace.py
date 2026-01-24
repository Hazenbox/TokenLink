#!/usr/bin/env python3
"""
Deep tracing of MyJio color alias chains to understand complete mapping patterns
"""
import json
from typing import Dict, List, Any, Tuple

def load_data():
    with open('/Users/upendranath.kaki/Desktop/Codes/VarCar/OneUI Foundations [POC]-variables-full.json', 'r') as f:
        return json.load(f)

def build_variable_index(data: Dict) -> Tuple[Dict, Dict]:
    """Build indexes: by ID and by collection"""
    var_index = {}
    collection_index = {}
    
    for collection in data['collections']:
        collection_index[collection['id']] = collection
        for var in collection.get('variables', []):
            var_index[var['id']] = {
                **var,
                'collection_name': collection['name'],
                'collection_id': collection['id'],
                'modes': collection['modes']
            }
    return var_index, collection_index

def get_mode_id_for_collection(collection: Dict, mode_name: str) -> str:
    """Get mode ID for a given mode name in a collection"""
    for mode in collection['modes']:
        if mode['name'] == mode_name:
            return mode['modeId']
    return None

def trace_complete_chain(var_id: str, var_index: Dict, visited: set = None) -> List[Dict]:
    """Trace complete alias chain across all modes"""
    if visited is None:
        visited = set()
    
    if var_id in visited or var_id not in var_index:
        return []
    
    visited.add(var_id)
    var = var_index[var_id]
    
    chain = [{
        'id': var_id,
        'name': var['name'],
        'collection': var['collection_name'],
        'collection_id': var['collection_id'],
        'type': var['resolvedType'],
        'values': {}
    }]
    
    # Process each mode
    for mode in var['modes']:
        mode_id = mode['modeId']
        mode_name = mode['name']
        
        values = var.get('valuesByMode', {})
        if mode_id in values:
            value = values[mode_id]
            if isinstance(value, dict) and value.get('type') == 'VARIABLE_ALIAS':
                # Follow alias
                aliased_id = value['id']
                chain[0]['values'][mode_name] = {
                    'type': 'alias',
                    'target_id': aliased_id,
                    'target_name': var_index.get(aliased_id, {}).get('name', 'Unknown')
                }
                # Recursively trace
                sub_chain = trace_complete_chain(aliased_id, var_index, visited.copy())
                if sub_chain:
                    chain.extend(sub_chain)
            elif isinstance(value, dict) and 'r' in value:
                # Direct color value
                chain[0]['values'][mode_name] = {
                    'type': 'color',
                    'rgba': f"rgba({value['r']:.3f}, {value['g']:.3f}, {value['b']:.3f}, {value['a']:.3f})"
                }
    
    return chain

def analyze_myjio_deep(data: Dict, var_index: Dict):
    """Deep analysis of MyJio color mappings"""
    print("=" * 100)
    print("DEEP MyJio COLOR MAPPING ANALYSIS")
    print("=" * 100)
    
    # Get Theme collection
    theme_collection = next((c for c in data['collections'] if c['name'] == '9 Theme'), None)
    if not theme_collection:
        return
    
    myjio_mode_id = get_mode_id_for_collection(theme_collection, 'MyJio')
    
    # Trace key variables
    key_variables = [
        'Jio/Surfaces/[Theme] Surface',
        'Jio/Primary/[Theme] Surface',
        'Jio/Secondary/[Theme] Surface',
        'Jio/Sparkle/[Theme] Surface',
    ]
    
    for var_name in key_variables:
        var = next((v for v in theme_collection['variables'] if v['name'] == var_name), None)
        if not var:
            continue
        
        print(f"\n{'='*100}")
        print(f"VARIABLE: {var_name}")
        print(f"ID: {var['id']}")
        print(f"{'='*100}")
        
        chain = trace_complete_chain(var['id'], var_index)
        
        for i, link in enumerate(chain):
            print(f"\n[Level {i}] Collection: {link['collection']}")
            print(f"         Variable: {link['name']}")
            print(f"         ID: {link['id']}")
            
            if link['values']:
                print(f"         Values:")
                for mode_name, mode_value in link['values'].items():
                    if mode_value['type'] == 'alias':
                        print(f"           {mode_name}: → {mode_value['target_name']}")
                    elif mode_value['type'] == 'color':
                        print(f"           {mode_name}: {mode_value['rgba']}")

def identify_color_families(data: Dict, var_index: Dict):
    """Identify color families and their relationships"""
    print("\n\n" + "=" * 100)
    print("COLOR FAMILIES & SEMANTIC GROUPS")
    print("=" * 100)
    
    # Analyze Color Mode collection to understand color families
    color_mode_collection = next((c for c in data['collections'] if c['name'] == '02 Colour Mode'), None)
    if not color_mode_collection:
        return
    
    # Group by color family
    families = {}
    for var in color_mode_collection['variables']:
        if var.get('resolvedType') == 'COLOR':
            name = var['name']
            parts = name.split('/')
            if len(parts) >= 1:
                family = parts[0]
                if family not in families:
                    families[family] = []
                families[family].append(var)
    
    print(f"\nIdentified {len(families)} color families:\n")
    for family, vars in sorted(families.items()):
        print(f"  {family}: {len(vars)} variables")
        
        # Analyze structure within family
        subcategories = {}
        for var in vars:
            parts = var['name'].split('/')
            if len(parts) >= 2:
                subcat = parts[1]
                subcategories[subcat] = subcategories.get(subcat, 0) + 1
        
        if subcategories:
            print(f"    Subcategories: {', '.join(sorted(subcategories.keys())[:5])}")

def analyze_semantic_layers(data: Dict, var_index: Dict):
    """Analyze the semantic layering structure"""
    print("\n\n" + "=" * 100)
    print("SEMANTIC LAYER ANALYSIS")
    print("=" * 100)
    
    # Semi-semantics collection
    semi_sem = next((c for c in data['collections'] if c['name'] == '00_Semi semantics'), None)
    if semi_sem:
        print(f"\n[Layer 1] {semi_sem['name']}")
        print(f"  Variables: {len(semi_sem['variables'])}")
        
        # Sample a few variables
        sample_vars = [v for v in semi_sem['variables'] if v.get('resolvedType') == 'COLOR'][:5]
        print(f"\n  Sample variables:")
        for var in sample_vars:
            print(f"    - {var['name']}")
            values = var.get('valuesByMode', {})
            for mode in semi_sem['modes']:
                mode_id = mode['modeId']
                if mode_id in values:
                    value = values[mode_id]
                    if isinstance(value, dict) and value.get('type') == 'VARIABLE_ALIAS':
                        target = var_index.get(value['id'], {})
                        print(f"      {mode['name']}: → {target.get('name', 'Unknown')} [{target.get('collection_name', 'Unknown')}]")
                    elif isinstance(value, dict) and 'r' in value:
                        print(f"      {mode['name']}: rgba({value['r']:.3f}, {value['g']:.3f}, {value['b']:.3f}, {value['a']:.3f})")

def generate_automation_patterns(data: Dict, var_index: Dict):
    """Generate automation patterns based on analysis"""
    print("\n\n" + "=" * 100)
    print("AUTOMATION PATTERNS & RULES")
    print("=" * 100)
    
    print("\n1. COLLECTION HIERARCHY PATTERN:")
    print("   ```")
    print("   Primitives (00_Primitives)")
    print("   └─→ Semi-semantics (00_Semi semantics)")
    print("       └─→ Color Mode (02 Colour Mode) [Light/Dark]")
    print("           └─→ Appearance (1 Appearance) [Neutral/Primary/etc.]")
    print("               └─→ Fill Emphasis (2 Fill emphasis) [Ghost/Minimal/etc.]")
    print("                   └─→ Background Level (3 Background Level) [Level 0/1/2]")
    print("                       └─→ Interaction State (4 Interaction state) [Idle/Hover/etc.]")
    print("                           └─→ Theme (9 Theme) [MyJio/JioFinance/JioHome]")
    print("                               └─→ Brand (10 Brand) [Jio/JS]")
    print("   ```")
    
    print("\n2. VARIABLE NAMING PATTERN:")
    print("   Format: {ColorFamily}/{SemanticCategory}/{Context}/{Property}")
    print("   Examples:")
    print("     - Indigo/Semantics/Bold/Bold/Hover/[Colour Mode] Bold")
    print("     - Jio/Surfaces/[Theme] Surface")
    print("     - DataVis/MyJio/categorical/bold/1")
    
    print("\n3. MODE BRANCHING PATTERN:")
    print("   - Each collection can have multiple modes")
    print("   - Variables must define values for ALL modes in their collection")
    print("   - Modes enable context-specific variations (Light/Dark, MyJio/JioFinance, etc.)")
    
    print("\n4. ALIAS RESOLUTION PATTERN:")
    print("   - 93.8% of color values use aliases (referencing other variables)")
    print("   - Aliases create a dependency graph")
    print("   - Resolution follows the chain until reaching a concrete RGB value")
    print("   - Cross-collection aliases are common")
    
    print("\n5. CONTEXTUAL STACKING PATTERN:")
    print("   Variables are composed through contextual modes:")
    print("   - Base color (from Semi-semantics)")
    print("   - + Light/Dark mode variation")
    print("   - + Appearance context (Primary/Secondary/etc.)")
    print("   - + Fill emphasis (Ghost/Minimal/etc.)")
    print("   - + Background level")
    print("   - + Interaction state")
    print("   - + Brand theme")
    print("   = Final computed color")
    
    print("\n6. SEMANTIC CATEGORIZATION:")
    print("   Color families identified:")
    color_mode_collection = next((c for c in data['collections'] if c['name'] == '02 Colour Mode'), None)
    if color_mode_collection:
        families = set()
        for var in color_mode_collection['variables']:
            parts = var['name'].split('/')
            if parts:
                families.add(parts[0])
        
        semantic_families = [f for f in families if f in ['Positive', 'Negative', 'Warning', 'Informative']]
        color_families = [f for f in families if f not in semantic_families and f != 'DataVis']
        
        print(f"   - Semantic: {', '.join(sorted(semantic_families))}")
        print(f"   - Color-based: {', '.join(sorted(color_families)[:8])}...")

def main():
    print("Loading data...")
    data = load_data()
    
    print("Building indexes...")
    var_index, collection_index = build_variable_index(data)
    
    analyze_myjio_deep(data, var_index)
    identify_color_families(data, var_index)
    analyze_semantic_layers(data, var_index)
    generate_automation_patterns(data, var_index)
    
    print("\n\n" + "=" * 100)
    print("DEEP ANALYSIS COMPLETE")
    print("=" * 100)

if __name__ == "__main__":
    main()
