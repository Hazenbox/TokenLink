#!/usr/bin/env python3
"""
Comprehensive analysis of MyJio color variable mappings
"""
import json
from collections import defaultdict
from typing import Dict, List, Any

def load_data():
    with open('/Users/upendranath.kaki/Desktop/Codes/VarCar/OneUI Foundations [POC]-variables-full.json', 'r') as f:
        return json.load(f)

def build_variable_index(data: Dict) -> Dict[str, Dict]:
    """Build an index of all variables by ID"""
    var_index = {}
    for collection in data['collections']:
        for var in collection.get('variables', []):
            var_index[var['id']] = {
                **var,
                'collection_name': collection['name'],
                'collection_id': collection['id'],
                'modes': collection['modes']
            }
    return var_index

def trace_alias_chain(var_id: str, var_index: Dict, mode_id: str, depth: int = 0, max_depth: int = 10) -> List[Dict]:
    """Trace the full alias chain for a variable"""
    if depth >= max_depth or var_id not in var_index:
        return []
    
    var = var_index[var_id]
    chain = [{
        'depth': depth,
        'id': var_id,
        'name': var['name'],
        'collection': var['collection_name'],
        'type': var['resolvedType']
    }]
    
    values = var.get('valuesByMode', {})
    if mode_id in values:
        value = values[mode_id]
        if isinstance(value, dict) and value.get('type') == 'VARIABLE_ALIAS':
            # Follow the alias
            aliased_id = value['id']
            chain.append({
                'depth': depth,
                'alias_to': aliased_id
            })
            chain.extend(trace_alias_chain(aliased_id, var_index, mode_id, depth + 1, max_depth))
        else:
            # End of chain - actual color value
            chain.append({
                'depth': depth,
                'value': value
            })
    
    return chain

def analyze_collection_hierarchy(data: Dict, var_index: Dict):
    """Analyze the hierarchy of collections and their relationships"""
    print("=" * 80)
    print("COLLECTION HIERARCHY ANALYSIS")
    print("=" * 80)
    
    collections = data['collections']
    
    # Group collections by naming pattern
    collection_types = {
        'primitives': [],
        'semi_semantics': [],
        'theme': [],
        'contextual': [],
        'other': []
    }
    
    for i, col in enumerate(collections):
        name = col['name']
        if 'Primitive' in name or name == '00_Primitives':
            collection_types['primitives'].append((i, col))
        elif 'Semi semantic' in name or 'Semi semantics' in name:
            collection_types['semi_semantics'].append((i, col))
        elif 'Theme' in name or name == '9 Theme':
            collection_types['theme'].append((i, col))
        elif name in ['02 Colour Mode', '4 Interaction state', '3 Background Level', '2 Fill emphasis', '1 Appearance', '10 Brand']:
            collection_types['contextual'].append((i, col))
        else:
            collection_types['other'].append((i, col))
    
    for col_type, cols in collection_types.items():
        if cols:
            print(f"\n{col_type.upper().replace('_', ' ')}:")
            for idx, col in cols:
                print(f"  [{idx+1}] {col['name']}")
                print(f"      Modes: {', '.join([m['name'] for m in col['modes']])}")
                print(f"      Variables: {len(col.get('variables', []))}")

def analyze_myjio_color_patterns(data: Dict, var_index: Dict):
    """Analyze color patterns specific to MyJio"""
    print("\n\n" + "=" * 80)
    print("MyJio COLOR MAPPING PATTERNS")
    print("=" * 80)
    
    # Find Theme collection with MyJio mode
    theme_collection = next((c for c in data['collections'] if c['name'] == '9 Theme'), None)
    if not theme_collection:
        print("Theme collection not found!")
        return
    
    myjio_mode = next((m for m in theme_collection['modes'] if m['name'] == 'MyJio'), None)
    if not myjio_mode:
        print("MyJio mode not found!")
        return
    
    myjio_mode_id = myjio_mode['modeId']
    print(f"\nMyJio Mode ID: {myjio_mode_id}")
    
    # Sample different types of variables
    sample_vars = []
    for var in theme_collection['variables']:
        if var.get('resolvedType') == 'COLOR':
            name = var['name']
            if 'Surface' in name or 'Primary' in name or 'Secondary' in name:
                sample_vars.append(var)
                if len(sample_vars) >= 5:
                    break
    
    print(f"\n\nTRACING ALIAS CHAINS (Sample: {len(sample_vars)} variables)")
    print("-" * 80)
    
    for var in sample_vars:
        print(f"\n📌 {var['name']} (ID: {var['id']})")
        chain = trace_alias_chain(var['id'], var_index, myjio_mode_id)
        
        for i, link in enumerate(chain):
            if 'alias_to' in link:
                print(f"   {'  ' * link['depth']}↓ aliases to {link['alias_to']}")
            elif 'value' in link:
                value = link['value']
                if isinstance(value, dict) and 'r' in value:
                    print(f"   {'  ' * link['depth']}└─ COLOR: rgba({value['r']:.3f}, {value['g']:.3f}, {value['b']:.3f}, {value['a']:.3f})")
                else:
                    print(f"   {'  ' * link['depth']}└─ VALUE: {value}")
            else:
                indent = '  ' * link['depth']
                print(f"   {indent}[{link['collection']}] {link['name']}")

def analyze_color_mode_collection(data: Dict, var_index: Dict):
    """Analyze the Color Mode collection (Light/Dark)"""
    print("\n\n" + "=" * 80)
    print("COLOR MODE COLLECTION ANALYSIS (Light/Dark)")
    print("=" * 80)
    
    color_mode_collection = next((c for c in data['collections'] if c['name'] == '02 Colour Mode'), None)
    if not color_mode_collection:
        print("Color Mode collection not found!")
        return
    
    print(f"\nCollection: {color_mode_collection['name']}")
    print(f"Modes: {[m['name'] for m in color_mode_collection['modes']]}")
    print(f"Total variables: {len(color_mode_collection.get('variables', []))}")
    
    # Categorize variables by naming patterns
    patterns = defaultdict(list)
    for var in color_mode_collection['variables']:
        if var.get('resolvedType') == 'COLOR':
            name = var['name']
            # Extract category from name
            parts = name.split('/')
            if len(parts) >= 2:
                category = parts[0]
                patterns[category].append(var['name'])
    
    print("\n\nVARIABLE CATEGORIES:")
    for category, vars in sorted(patterns.items()):
        print(f"\n  {category}: {len(vars)} variables")
        # Show first 3 examples
        for var_name in sorted(vars)[:3]:
            print(f"    - {var_name}")
        if len(vars) > 3:
            print(f"    ... and {len(vars) - 3} more")

def analyze_brand_collection(data: Dict, var_index: Dict):
    """Analyze the Brand collection"""
    print("\n\n" + "=" * 80)
    print("BRAND COLLECTION ANALYSIS")
    print("=" * 80)
    
    brand_collection = next((c for c in data['collections'] if c['name'] == '10 Brand'), None)
    if not brand_collection:
        print("Brand collection not found!")
        return
    
    print(f"\nCollection: {brand_collection['name']}")
    print(f"Modes: {[m['name'] for m in brand_collection['modes']]}")
    print(f"Total variables: {len(brand_collection.get('variables', []))}")
    
    # Sample variables
    jio_mode = next((m for m in brand_collection['modes'] if m['name'] == 'Jio'), None)
    if jio_mode:
        jio_mode_id = jio_mode['modeId']
        print(f"\nJio Mode ID: {jio_mode_id}")
        
        # Sample 10 variables
        color_vars = [v for v in brand_collection['variables'] if v.get('resolvedType') == 'COLOR'][:10]
        print(f"\n\nSAMPLE VARIABLES (first 10):")
        for var in color_vars:
            print(f"\n  {var['name']}")
            values = var.get('valuesByMode', {})
            if jio_mode_id in values:
                value = values[jio_mode_id]
                if isinstance(value, dict) and value.get('type') == 'VARIABLE_ALIAS':
                    print(f"    Jio: → {value['id']}")
                elif isinstance(value, dict) and 'r' in value:
                    print(f"    Jio: rgba({value['r']:.3f}, {value['g']:.3f}, {value['b']:.3f}, {value['a']:.3f})")

def extract_mapping_rules(data: Dict, var_index: Dict):
    """Extract patterns and rules from the mapping structure"""
    print("\n\n" + "=" * 80)
    print("EXTRACTED MAPPING RULES & PATTERNS")
    print("=" * 80)
    
    # Analyze naming conventions
    print("\n1. NAMING CONVENTIONS:")
    print("   - Collections are numbered/prefixed (00_, 1, 2, etc.) indicating hierarchy")
    print("   - Variables use '/' as delimiter for hierarchical structure")
    print("   - Format: Category/Subcategory/[Context] Property")
    
    # Analyze alias patterns
    print("\n2. ALIASING PATTERNS:")
    alias_count = 0
    direct_color_count = 0
    
    for var_id, var in var_index.items():
        if var.get('resolvedType') == 'COLOR':
            for mode_id, value in var.get('valuesByMode', {}).items():
                if isinstance(value, dict) and value.get('type') == 'VARIABLE_ALIAS':
                    alias_count += 1
                elif isinstance(value, dict) and 'r' in value:
                    direct_color_count += 1
    
    print(f"   - Total alias references: {alias_count}")
    print(f"   - Total direct color values: {direct_color_count}")
    print(f"   - Alias ratio: {alias_count/(alias_count+direct_color_count)*100:.1f}%")
    
    # Analyze mode patterns
    print("\n3. MODE PATTERNS:")
    mode_collections = [c for c in data['collections'] if len(c['modes']) > 1]
    for col in mode_collections[:5]:  # Top 5
        print(f"   - {col['name']}: {len(col['modes'])} modes")
        print(f"     Modes: {', '.join([m['name'] for m in col['modes']])}")
    
    print("\n4. COLLECTION HIERARCHY (Inferred):")
    print("   Level 0: Primitives (hard-coded RGB values)")
    print("   Level 1: Semi-semantics (named colors, may alias primitives)")
    print("   Level 2: Contextual (Color Mode, Interaction State, etc.)")
    print("   Level 3: Theme (Brand-specific: MyJio, JioFinance, JioHome)")
    print("   Level 4: Application (DataVis, specific use cases)")

def main():
    print("Loading data...")
    data = load_data()
    print(f"Loaded {len(data['collections'])} collections")
    
    print("Building variable index...")
    var_index = build_variable_index(data)
    print(f"Indexed {len(var_index)} variables\n")
    
    analyze_collection_hierarchy(data, var_index)
    analyze_myjio_color_patterns(data, var_index)
    analyze_color_mode_collection(data, var_index)
    analyze_brand_collection(data, var_index)
    extract_mapping_rules(data, var_index)
    
    print("\n\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()
