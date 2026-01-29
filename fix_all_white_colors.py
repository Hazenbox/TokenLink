#!/usr/bin/env python3
"""
Fix ALL White Colors in Figma Variables

This enhanced script fixes white color values (RGB 1,1,1) across ALL collections,
not just the "00_Semi semantics" collection.

Strategy:
1. Find all variables with white RGB values
2. Match variable names to Rangde palette colors
3. Replace white with proper grey/color values from Rangde

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


def extract_color_info_from_name(var_name: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract palette name and step from variable name.
    
    Examples:
        "Grey/2500/Surface" -> ("grey", "2500")
        "Indigo/1000/[Semi semantics] Bold" -> ("indigo", "1000")
        "Grey/Semi semantics/Root/[Colour Mode] Surface" -> ("grey", None)
    
    Returns:
        (palette_name, step) or (None, None) if not parseable
    """
    # Common patterns
    patterns = [
        r'^(\w+)/(\d+)/',  # "Grey/2500/..."
        r'^(\w+)/(\d+)\s',  # "Grey/2500 ..."
    ]
    
    for pattern in patterns:
        match = re.match(pattern, var_name)
        if match:
            palette_name = match.group(1).lower()
            step = match.group(2)
            return (palette_name, step)
    
    # Check if it starts with a known palette name
    known_palettes = ['grey', 'indigo', 'gold', 'saffron', 'green', 'red', 'blue']
    for palette in known_palettes:
        if var_name.lower().startswith(palette + '/'):
            # Try to extract step from somewhere in the name
            step_match = re.search(r'/(\d{3,4})/', var_name)
            if step_match:
                return (palette, step_match.group(1))
            return (palette, None)
    
    return (None, None)


def fix_all_white_colors(data: dict, rangde_palettes_rgb: Dict[str, Dict[str, Tuple[float, float, float]]]) -> int:
    """
    Fix ALL white colors across ALL collections.
    Returns count of fixed variables.
    """
    fixed_count = 0
    
    # Process all collections
    for collection in data.get('collections', []):
        collection_name = collection.get('name', '')
        
        # Process all variables in the collection
        for variable in collection.get('variables', []):
            var_name = variable.get('name', '')
            
            # Extract palette and step info
            palette_name, step = extract_color_info_from_name(var_name)
            
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
                        # Try to get replacement color from Rangde
                        if palette_name and step and palette_name in rangde_palettes_rgb:
                            palette = rangde_palettes_rgb[palette_name]
                            if step in palette:
                                r, g, b = palette[step]
                                
                                # Preserve alpha, update RGB
                                alpha = mode_value.get('a', 1.0)
                                values_by_mode[mode_id] = {
                                    'r': round(r, 4),
                                    'g': round(g, 4),
                                    'b': round(b, 4),
                                    'a': alpha
                                }
                                fixed_count += 1
                                print(f"  Fixed: {var_name} (mode {mode_id})")
                            else:
                                print(f"  ⚠ No step {step} for {palette_name}: {var_name}")
                        else:
                            print(f"  ⚠ Could not parse color info: {var_name}")
    
    return fixed_count


def main():
    """Main execution"""
    print("=" * 70)
    print("Fix ALL White Colors in Figma Variables")
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
    
    # Step 1: Load Rangde palettes
    print("Step 1: Loading Rangde color palettes...")
    try:
        rangde_palettes = load_rangde_palettes(rangde_path)
        print(f"✓ Loaded {len(rangde_palettes)} palettes from Rangde")
    except Exception as e:
        print(f"Error loading Rangde palettes: {e}")
        return 1
    print()
    
    # Step 2: Convert palettes to RGB
    print("Step 2: Converting OKLCH palettes to RGB...")
    rangde_palettes_rgb = {}
    for palette_name, palette_data in rangde_palettes.items():
        rangde_palettes_rgb[palette_name] = convert_palette_to_rgb(palette_data)
    print(f"✓ Converted {len(rangde_palettes_rgb)} palettes")
    print()
    
    # Step 3: Load variables JSON
    print("Step 3: Loading variables JSON...")
    with open(variables_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"✓ Loaded {len(data.get('collections', []))} collections")
    print()
    
    # Step 4: Count white colors before fix
    print("Step 4: Counting white colors...")
    white_count = 0
    for collection in data.get('collections', []):
        for variable in collection.get('variables', []):
            for mode_value in variable.get('valuesByMode', {}).values():
                if isinstance(mode_value, dict) and 'r' in mode_value:
                    if (mode_value.get('r') == 1.0 and 
                        mode_value.get('g') == 1.0 and 
                        mode_value.get('b') == 1.0):
                        white_count += 1
    print(f"Found {white_count} white color values")
    print()
    
    # Step 5: Fix all white colors
    print("Step 5: Fixing all white colors...")
    fixed = fix_all_white_colors(data, rangde_palettes_rgb)
    print(f"✓ Fixed {fixed} white color values")
    print()
    
    # Step 6: Save updated file
    print("Step 6: Saving updated variables file...")
    with open(variables_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved to {variables_file.name}")
    print()
    
    # Summary
    print("=" * 70)
    print("FIX SUMMARY")
    print("=" * 70)
    print(f"White colors found:  {white_count}")
    print(f"White colors fixed:  {fixed}")
    print(f"Remaining:           {white_count - fixed}")
    print()
    
    if fixed == white_count:
        print("✓ All white colors fixed successfully!")
    else:
        print(f"⚠ {white_count - fixed} white colors could not be fixed (no matching Rangde palette)")
    
    print()
    
    return 0


if __name__ == '__main__':
    exit(main())
