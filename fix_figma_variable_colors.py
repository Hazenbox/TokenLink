#!/usr/bin/env python3
"""
Fix Figma Variable Colors

This script fixes two critical issues in the OneUI Foundations variables file:
1. Grey colors showing as white (RGB 1,1,1) instead of proper grey values
2. External library references that don't exist in the file

Solution:
- Uses Rangde color-palettes.json as source of truth
- Converts OKLCH colors to RGB
- Updates all affected variables

Author: Senior Figma Plugin Engineer
"""

import json
import math
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional


def oklch_to_rgb(oklch_string: str) -> Tuple[float, float, float]:
    """
    Convert OKLCH color string to RGB values (0-1 range).
    
    Format: oklch(L% C H) where:
    - L: Lightness (0-100%)
    - C: Chroma
    - H: Hue (degrees)
    
    Conversion: OKLCH -> OKLab -> Linear RGB -> sRGB
    """
    # Parse oklch string
    match = re.match(r'oklch\(([^)]+)\)', oklch_string)
    if not match:
        return (0.0, 0.0, 0.0)
    
    parts = match.group(1).split()
    if len(parts) < 3:
        return (0.0, 0.0, 0.0)
    
    # Extract L, C, H
    L = float(parts[0].rstrip('%')) / 100  # Convert % to 0-1
    C = float(parts[1])
    H = float(parts[2]) * math.pi / 180  # Convert degrees to radians
    
    # OKLCH to OKLab
    a = C * math.cos(H)
    b = C * math.sin(H)
    
    # OKLab to Linear RGB
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    
    l = l_ * l_ * l_
    m = m_ * m_ * m_
    s = s_ * s_ * s_
    
    r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    
    # Linear RGB to sRGB (gamma correction)
    def linear_to_srgb(val):
        val = max(0, min(1, val))  # Clamp
        if val <= 0.0031308:
            return val * 12.92
        return 1.055 * (val ** (1/2.4)) - 0.055
    
    r = linear_to_srgb(r_lin)
    g = linear_to_srgb(g_lin)
    b = linear_to_srgb(b_lin)
    
    return (r, g, b)


def load_rangde_palettes(rangde_path: Path) -> Dict[str, Dict[str, str]]:
    """Load color palettes from Rangde's color-palettes.json"""
    palette_file = rangde_path / "rang-de-app/src/lib/color-palettes.json"
    
    if not palette_file.exists():
        raise FileNotFoundError(f"Rangde palette file not found: {palette_file}")
    
    with open(palette_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def convert_palette_to_rgb(palette: Dict[str, str]) -> Dict[str, Tuple[float, float, float]]:
    """Convert an entire palette from OKLCH to RGB"""
    rgb_palette = {}
    
    for step, oklch_value in palette.items():
        if step == 'base':
            continue
        
        rgb_palette[step] = oklch_to_rgb(oklch_value)
    
    return rgb_palette


def create_backup(original_file: Path) -> Path:
    """Create timestamped backup of the original file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = original_file.parent / f"{original_file.stem}_backup_{timestamp}.json"
    
    print(f"Creating backup: {backup_file.name}")
    
    with open(original_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Backup created successfully")
    return backup_file


def fix_grey_colors(data: dict, grey_rgb_palette: Dict[str, Tuple[float, float, float]]) -> int:
    """
    Fix Grey colors in 00_Semi semantics collection.
    Returns count of fixed variables.
    """
    fixed_count = 0
    
    # Find the "00_Semi semantics" collection
    semi_semantics = None
    for collection in data.get('collections', []):
        if collection.get('name') == '00_Semi semantics':
            semi_semantics = collection
            break
    
    if not semi_semantics:
        print("Warning: '00_Semi semantics' collection not found")
        return 0
    
    # Process all variables in the collection
    for variable in semi_semantics.get('variables', []):
        var_name = variable.get('name', '')
        
        # Check if this is a Grey variable
        if not var_name.startswith('Grey/'):
            continue
        
        # Extract step from variable name (e.g., "Grey/2500/Surface" -> "2500")
        name_parts = var_name.split('/')
        if len(name_parts) < 2:
            continue
        
        step = name_parts[1]
        
        # Get RGB value for this step
        if step not in grey_rgb_palette:
            print(f"Warning: No RGB value for Grey step {step}")
            continue
        
        r, g, b = grey_rgb_palette[step]
        
        # Update all modes for this variable
        values_by_mode = variable.get('valuesByMode', {})
        for mode_id, mode_value in values_by_mode.items():
            # Only update if it's a direct color value (not an alias)
            if isinstance(mode_value, dict) and 'r' in mode_value:
                # Check if it's currently white (the bug we're fixing)
                current_r = mode_value.get('r', 0)
                current_g = mode_value.get('g', 0)
                current_b = mode_value.get('b', 0)
                
                if current_r == 1.0 and current_g == 1.0 and current_b == 1.0:
                    # Preserve alpha, update RGB
                    alpha = mode_value.get('a', 1.0)
                    values_by_mode[mode_id] = {
                        'r': round(r, 4),
                        'g': round(g, 4),
                        'b': round(b, 4),
                        'a': alpha
                    }
                    fixed_count += 1
    
    return fixed_count


def fix_external_references(data: dict, rangde_palettes_rgb: Dict[str, Dict[str, Tuple[float, float, float]]]) -> int:
    """
    Fix external library references by replacing them with RGB values from Rangde.
    Returns count of fixed references.
    """
    fixed_count = 0
    external_ref_pattern = re.compile(r'^VariableID:[a-f0-9]+/\d+:\d+$')
    
    # Find the "00_Semi semantics" collection
    semi_semantics = None
    for collection in data.get('collections', []):
        if collection.get('name') == '00_Semi semantics':
            semi_semantics = collection
            break
    
    if not semi_semantics:
        return 0
    
    # Process all variables
    for variable in semi_semantics.get('variables', []):
        var_name = variable.get('name', '')
        values_by_mode = variable.get('valuesByMode', {})
        
        for mode_id, mode_value in values_by_mode.items():
            # Check if this is an external reference
            if isinstance(mode_value, dict) and mode_value.get('type') == 'VARIABLE_ALIAS':
                alias_id = mode_value.get('id', '')
                
                # Check if it's an external reference (contains "/" in ID)
                if '/' in alias_id:
                    # Extract palette name and step from variable name
                    # E.g., "Indigo/2500/[Semi semantics] Surface" -> palette: indigo, step: 2500
                    name_parts = var_name.split('/')
                    if len(name_parts) < 2:
                        continue
                    
                    palette_name = name_parts[0].lower()  # "Indigo" -> "indigo"
                    step = name_parts[1]  # "2500"
                    
                    # Get RGB value from Rangde palettes
                    if palette_name in rangde_palettes_rgb:
                        palette = rangde_palettes_rgb[palette_name]
                        if step in palette:
                            r, g, b = palette[step]
                            
                            # Replace external reference with direct RGB value
                            # Preserve alpha if it was part of the variable name
                            alpha = 1.0
                            if 'surface' in var_name.lower():
                                alpha = 0.08  # Common alpha for surface variants
                            
                            values_by_mode[mode_id] = {
                                'r': round(r, 4),
                                'g': round(g, 4),
                                'b': round(b, 4),
                                'a': alpha
                            }
                            fixed_count += 1
                            print(f"Fixed external ref: {var_name} (step {step})")
    
    return fixed_count


def main():
    """Main execution"""
    print("=" * 70)
    print("Figma Variable Colors Fix Script")
    print("=" * 70)
    print()
    
    # Paths
    workspace = Path("/Users/upendranath.kaki/Desktop/Codes/VarCar")
    variables_file = workspace / "OneUI Foundations [POC]-variables-full.json"
    rangde_path = workspace / "Rangde-main"
    
    # Verify files exist
    if not variables_file.exists():
        print(f"Error: Variables file not found: {variables_file}")
        return 1
    
    if not rangde_path.exists():
        print(f"Error: Rangde directory not found: {rangde_path}")
        return 1
    
    print(f"Variables file: {variables_file.name}")
    print(f"Rangde path: {rangde_path.name}")
    print()
    
    # Step 1: Create backup
    print("Step 1: Creating backup...")
    backup_file = create_backup(variables_file)
    print()
    
    # Step 2: Load Rangde palettes
    print("Step 2: Loading Rangde color palettes...")
    try:
        rangde_palettes = load_rangde_palettes(rangde_path)
        print(f"✓ Loaded {len(rangde_palettes)} palettes from Rangde")
    except Exception as e:
        print(f"Error loading Rangde palettes: {e}")
        return 1
    print()
    
    # Step 3: Convert palettes to RGB
    print("Step 3: Converting OKLCH palettes to RGB...")
    rangde_palettes_rgb = {}
    for palette_name, palette_data in rangde_palettes.items():
        rangde_palettes_rgb[palette_name] = convert_palette_to_rgb(palette_data)
        print(f"  ✓ Converted {palette_name}: {len(rangde_palettes_rgb[palette_name])} steps")
    print()
    
    # Step 4: Load variables JSON
    print("Step 4: Loading variables JSON...")
    with open(variables_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"✓ Loaded {len(data.get('collections', []))} collections")
    print()
    
    # Step 5: Fix Grey colors
    print("Step 5: Fixing Grey colors...")
    grey_fixed = fix_grey_colors(data, rangde_palettes_rgb['grey'])
    print(f"✓ Fixed {grey_fixed} Grey color variables")
    print()
    
    # Step 6: Fix external references
    print("Step 6: Fixing external library references...")
    ext_fixed = fix_external_references(data, rangde_palettes_rgb)
    print(f"✓ Fixed {ext_fixed} external reference variables")
    print()
    
    # Step 7: Save updated file
    print("Step 7: Saving updated variables file...")
    with open(variables_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved to {variables_file.name}")
    print()
    
    # Summary
    print("=" * 70)
    print("FIX SUMMARY")
    print("=" * 70)
    print(f"Grey colors fixed:          {grey_fixed}")
    print(f"External references fixed:  {ext_fixed}")
    print(f"Total fixes:                {grey_fixed + ext_fixed}")
    print(f"Backup location:            {backup_file.name}")
    print()
    print("✓ All fixes applied successfully!")
    print()
    
    return 0


if __name__ == '__main__':
    exit(main())
