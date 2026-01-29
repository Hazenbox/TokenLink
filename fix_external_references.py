#!/usr/bin/env python3
"""
Fix External Variable References in Figma Variables Export

This script replaces all broken external variable references with direct color values.
Strategy:
1. For colors with working [Semi semantics] variables: use their RGB values
2. For Grey (no working vars): use white RGB with varying alpha
3. Apply appropriate alpha values based on weight type
"""

import json
import sys
from collections import defaultdict

# Alpha values for different weight types
WEIGHT_ALPHA_MAP = {
    'Surface': 0.08,
    'Minimal': 0.15,
    'Low': 0.55,
    'Medium': 0.77,
    'High': 0.87,
    'Heavy': 0.93,
    'Bold': 0.92,
    'Bold A11Y': 1.0
}

# Grey RGB values (white in light mode)
GREY_RGB = {'r': 1.0, 'g': 1.0, 'b': 1.0}

def load_json(filename):
    """Load JSON file"""
    with open(filename, 'r') as f:
        return json.load(f)

def save_json(filename, data):
    """Save JSON file"""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

def extract_rgb_values_from_working_vars(semi_semantics_coll):
    """Extract RGB values from working [Semi semantics] variables"""
    rgb_by_color_value = defaultdict(dict)
    
    for var in semi_semantics_coll['variables']:
        name = var['name']
        parts = name.split('/')
        
        if '[Semi semantics]' in name and len(parts) >= 2:
            color = parts[0]
            value_level = parts[1]
            
            # Get direct color value
            for mode_id, value_data in var['valuesByMode'].items():
                if isinstance(value_data, dict) and 'r' in value_data:
                    key = f"{color}/{value_level}"
                    rgb_by_color_value[key] = {
                        'r': value_data['r'],
                        'g': value_data['g'],
                        'b': value_data['b']
                    }
                    break
    
    return rgb_by_color_value

def get_rgb_for_variable(var_name, rgb_by_color_value):
    """Get RGB values for a variable"""
    parts = var_name.split('/')
    if len(parts) < 2:
        return None
    
    color = parts[0]
    value_level = parts[1]
    key = f"{color}/{value_level}"
    
    # Try to get from working variables
    if key in rgb_by_color_value:
        return rgb_by_color_value[key].copy()
    
    # For Grey, use white
    if color == 'Grey':
        return GREY_RGB.copy()
    
    # Default fallback (shouldn't happen often)
    print(f"  Warning: No RGB found for {key}, using grey as fallback")
    return GREY_RGB.copy()

def get_alpha_for_weight(weight):
    """Get alpha value for a weight type"""
    # Try exact match first
    if weight in WEIGHT_ALPHA_MAP:
        return WEIGHT_ALPHA_MAP[weight]
    
    # Try partial match
    for key, alpha in WEIGHT_ALPHA_MAP.items():
        if key in weight:
            return alpha
    
    # Default to Medium
    print(f"  Warning: Unknown weight '{weight}', using Medium alpha")
    return WEIGHT_ALPHA_MAP['Medium']

def fix_external_references(data):
    """Fix all external references in the data"""
    stats = {
        'total_variables': 0,
        'fixed_variables': 0,
        'already_ok': 0,
        'errors': 0
    }
    
    # Find 00_Semi semantics collection
    semi_semantics_coll = None
    for coll in data['collections']:
        if coll['name'] == "00_Semi semantics":
            semi_semantics_coll = coll
            break
    
    if not semi_semantics_coll:
        print("ERROR: Could not find 00_Semi semantics collection")
        return stats
    
    print("Extracting RGB values from working variables...")
    rgb_by_color_value = extract_rgb_values_from_working_vars(semi_semantics_coll)
    print(f"  Found {len(rgb_by_color_value)} color/value combinations with RGB data")
    
    print("\nFixing external references in 00_Semi semantics collection...")
    
    for var in semi_semantics_coll['variables']:
        stats['total_variables'] += 1
        var_name = var['name']
        
        # Skip variables that already have direct color values or [Semi semantics] in name
        if '[Semi semantics]' in var_name:
            stats['already_ok'] += 1
            continue
        
        # Check if variable has external references
        has_external = False
        for mode_id, value in var['valuesByMode'].items():
            if isinstance(value, dict) and 'type' in value:
                if value['type'] == 'VARIABLE_ALIAS' and '/' in value.get('id', ''):
                    has_external = True
                    break
        
        if not has_external:
            stats['already_ok'] += 1
            continue
        
        # Extract weight from variable name
        parts = var_name.split('/')
        if len(parts) < 3:
            stats['errors'] += 1
            print(f"  Error: Unexpected name format: {var_name}")
            continue
        
        weight = parts[2]
        
        # Get RGB values
        rgb = get_rgb_for_variable(var_name, rgb_by_color_value)
        if not rgb:
            stats['errors'] += 1
            continue
        
        # Get alpha value
        alpha = get_alpha_for_weight(weight)
        
        # Replace external reference with direct color value
        for mode_id in var['valuesByMode'].keys():
            var['valuesByMode'][mode_id] = {
                'r': rgb['r'],
                'g': rgb['g'],
                'b': rgb['b'],
                'a': alpha
            }
        
        stats['fixed_variables'] += 1
        
        if stats['fixed_variables'] % 100 == 0:
            print(f"  Fixed {stats['fixed_variables']} variables...")
    
    return stats

def main():
    input_file = 'OneUI Foundations [POC]-variables-full.json'
    output_file = 'OneUI Foundations [POC]-variables-full-FIXED.json'
    
    print("="*80)
    print("FIXING EXTERNAL VARIABLE REFERENCES")
    print("="*80)
    print(f"\nLoading {input_file}...")
    
    try:
        data = load_json(input_file)
        print(f"  Loaded {len(data['collections'])} collections")
    except Exception as e:
        print(f"ERROR loading file: {e}")
        return 1
    
    print("\nProcessing variables...")
    stats = fix_external_references(data)
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total variables processed: {stats['total_variables']}")
    print(f"Fixed (external refs replaced): {stats['fixed_variables']}")
    print(f"Already OK (no changes needed): {stats['already_ok']}")
    print(f"Errors: {stats['errors']}")
    
    if stats['fixed_variables'] > 0:
        print(f"\nSaving fixed data to {output_file}...")
        try:
            save_json(output_file, data)
            print("✅ Successfully saved!")
            print(f"\nNext steps:")
            print(f"1. Review the changes in {output_file}")
            print(f"2. Test import in Figma")
            print(f"3. If all looks good, replace the original file")
        except Exception as e:
            print(f"ERROR saving file: {e}")
            return 1
    else:
        print("\nNo changes made.")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
