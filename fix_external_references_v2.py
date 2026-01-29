#!/usr/bin/env python3
"""
Fix External Variable References in Figma Variables Export - Version 2

This script replaces all broken external variable references with direct color values.
Uses actual RGB values discovered from existing variables in the file.
"""

import json
import sys
from collections import defaultdict

# Alpha values for different weight types (based on design system standards)
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

# Actual RGB values discovered from the file
COLOR_RGB_MAP = {
    'Grey': {'r': 1.0, 'g': 1.0, 'b': 1.0},  # White for grey
    'Indigo': {'r': 0.040, 'g': 0.000, 'b': 0.200},
    'Saffron': {'r': 0.110, 'g': 0.020, 'b': 0.000},
    'Green': {'r': 0.000, 'g': 0.070, 'b': 0.020},
    'Gold': {'r': 0.060, 'g': 0.050, 'b': 0.040},
    'Cabbage': {'r': 0.060, 'g': 0.050, 'b': 0.040},
    'Orange': {'r': 0.100, 'g': 0.030, 'b': 0.000},
    'Informative': {'r': 0.000, 'g': 0.050, 'b': 0.120},
    'Negative': {'r': 0.130, 'g': 0.000, 'b': 0.010},
    'Positive': {'r': 0.030, 'g': 0.060, 'b': 0.030},
    'Warning': {'r': 0.110, 'g': 0.020, 'b': 0.000},
    'Purple [700]': {'r': 0.060, 'g': 0.050, 'b': 0.040},
    'Sky [1200]': {'r': 0.000, 'g': 0.060, 'b': 0.100},
    'Sky [1000]': {'r': 0.000, 'g': 0.060, 'b': 0.100},
}

def load_json(filename):
    """Load JSON file"""
    print(f"Loading {filename}...", end=" ")
    with open(filename, 'r') as f:
        data = json.load(f)
    print("✓")
    return data

def save_json(filename, data):
    """Save JSON file"""
    print(f"Saving {filename}...", end=" ")
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print("✓")

def get_rgb_for_color(color_name):
    """Get RGB values for a color"""
    if color_name in COLOR_RGB_MAP:
        return COLOR_RGB_MAP[color_name].copy()
    
    # Try to find partial match
    for key in COLOR_RGB_MAP:
        if color_name.startswith(key):
            return COLOR_RGB_MAP[key].copy()
    
    # Default to grey
    print(f"  Warning: Unknown color '{color_name}', using Grey")
    return COLOR_RGB_MAP['Grey'].copy()

def get_alpha_for_weight(weight):
    """Get alpha value for a weight type"""
    if weight in WEIGHT_ALPHA_MAP:
        return WEIGHT_ALPHA_MAP[weight]
    
    # Try partial match
    for key, alpha in WEIGHT_ALPHA_MAP.items():
        if key in weight:
            return alpha
    
    # Default to Medium
    return WEIGHT_ALPHA_MAP['Medium']

def fix_external_references(data):
    """Fix all external references in the data"""
    stats = {
        'total_variables': 0,
        'fixed_variables': 0,
        'already_ok': 0,
        'external_refs_found': 0,
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
    
    print(f"Processing {len(semi_semantics_coll['variables'])} variables...")
    
    for idx, var in enumerate(semi_semantics_coll['variables']):
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
                    stats['external_refs_found'] += 1
                    break
        
        if not has_external:
            stats['already_ok'] += 1
            continue
        
        # Parse variable name
        parts = var_name.split('/')
        if len(parts) < 3:
            stats['errors'] += 1
            print(f"  Error: Unexpected name format: {var_name}")
            continue
        
        color_name = parts[0]
        value_level = parts[1]
        weight = parts[2]
        
        # Get RGB and alpha
        rgb = get_rgb_for_color(color_name)
        alpha = get_alpha_for_weight(weight)
        
        # Special case: for very high value levels (2500, 2400, 2300, 2200, 2100), use white RGB
        try:
            value_num = int(value_level)
            if value_num >= 2100:
                rgb = COLOR_RGB_MAP['Grey'].copy()  # Use white
        except ValueError:
            pass  # Keep the color RGB for non-numeric values
        
        # Replace external reference with direct color value
        for mode_id in var['valuesByMode'].keys():
            var['valuesByMode'][mode_id] = {
                'r': rgb['r'],
                'g': rgb['g'],
                'b': rgb['b'],
                'a': alpha
            }
        
        stats['fixed_variables'] += 1
        
        if (idx + 1) % 500 == 0:
            print(f"  Processed {idx + 1}/{len(semi_semantics_coll['variables'])} variables...")
    
    return stats

def main():
    input_file = 'OneUI Foundations [POC]-variables-full.json'
    output_file = 'OneUI Foundations [POC]-variables-full-FIXED.json'
    
    print("="*80)
    print("FIXING EXTERNAL VARIABLE REFERENCES - V2")
    print("="*80)
    print()
    
    try:
        data = load_json(input_file)
    except Exception as e:
        print(f"\n❌ ERROR loading file: {e}")
        return 1
    
    print()
    stats = fix_external_references(data)
    
    print()
    print("="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total variables processed:      {stats['total_variables']}")
    print(f"External references found:      {stats['external_refs_found']}")
    print(f"Fixed (external refs replaced): {stats['fixed_variables']}")
    print(f"Already OK (no changes needed): {stats['already_ok']}")
    print(f"Errors:                         {stats['errors']}")
    print()
    
    if stats['fixed_variables'] > 0:
        try:
            save_json(output_file, data)
            print()
            print("="*80)
            print("SUCCESS!")
            print("="*80)
            print(f"✓ Fixed file saved as: {output_file}")
            print()
            print("Next steps:")
            print("1. Verify the fixed file loads correctly")
            print("2. Compare a few variables manually")
            print("3. Replace the original file if satisfied")
        except Exception as e:
            print(f"\n❌ ERROR saving file: {e}")
            return 1
    else:
        print("\nNo changes made.")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
