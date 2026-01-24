#!/usr/bin/env python3
"""
Generate comprehensive Markdown documentation for MyJio color mapping analysis
"""
import json
from datetime import datetime

def load_automation_rules():
    """Load the generated automation rules JSON"""
    with open('/Users/upendranath.kaki/Desktop/Codes/VarCar/myjio_color_automation_rules.json', 'r') as f:
        return json.load(f)

def generate_markdown_doc(rules: dict) -> str:
    """Generate comprehensive Markdown documentation"""
    
    md = []
    
    # Header
    md.append("# MyJio Color Variable Mapping - Comprehensive Analysis")
    md.append("")
    md.append(f"**Analysis Date**: {rules['metadata']['analysis_date']}")
    md.append(f"**Source**: {rules['metadata']['source_file']}")
    md.append(f"**Tool**: {rules['metadata']['tool']}")
    md.append("")
    md.append("---")
    md.append("")
    
    # Table of Contents
    md.append("## Table of Contents")
    md.append("")
    md.append("1. [Executive Summary](#executive-summary)")
    md.append("2. [Statistics Overview](#statistics-overview)")
    md.append("3. [Collection Architecture](#collection-architecture)")
    md.append("4. [Naming Conventions](#naming-conventions)")
    md.append("5. [Mode System](#mode-system)")
    md.append("6. [Alias Resolution](#alias-resolution)")
    md.append("7. [Color Scale Pattern](#color-scale-pattern)")
    md.append("8. [MyJio Brand Specifics](#myjio-brand-specifics)")
    md.append("9. [Automation Rules](#automation-rules)")
    md.append("10. [Implementation Guide](#implementation-guide)")
    md.append("11. [Appendix: Example Variables](#appendix-example-variables)")
    md.append("")
    md.append("---")
    md.append("")
    
    # Executive Summary
    md.append("## Executive Summary")
    md.append("")
    md.append("This document provides a comprehensive analysis of the **MyJio** brand color variable mapping")
    md.append("system extracted from Figma variables export. The system uses a sophisticated multi-layered")
    md.append("architecture with extensive aliasing to create a scalable, maintainable design token system.")
    md.append("")
    md.append("### Key Highlights")
    md.append("")
    stats = rules['statistics']
    md.append(f"- **Total Variables**: {stats['total_variables']:,}")
    md.append(f"- **Collections**: {stats['total_collections']}")
    md.append(f"- **Alias Usage**: {stats['alias_statistics']['alias_percentage']}% (highly interconnected)")
    md.append(f"- **Hierarchy Depth**: 7 layers from primitives to brand tokens")
    md.append("- **Multi-Mode Support**: Theme (MyJio/JioFinance/JioHome), Light/Dark, Interaction States")
    md.append("")
    md.append("### Architecture Philosophy")
    md.append("")
    md.append("The system follows a **token aliasing pyramid**:")
    md.append("")
    md.append("```")
    md.append("           Brand Tokens (10 Brand)")
    md.append("                    ↑")
    md.append("           Theme Tokens (9 Theme)")
    md.append("                    ↑")
    md.append("        Contextual Tokens (Appearance, Fill, etc.)")
    md.append("                    ↑")
    md.append("          Color Mode (Light/Dark)")
    md.append("                    ↑")
    md.append("        Semi-semantic Tokens (Named scales)")
    md.append("                    ↑")
    md.append("          Primitive Values (RGB)")
    md.append("```")
    md.append("")
    md.append("This architecture enables:")
    md.append("- **Centralized control**: Change a primitive, update entire system")
    md.append("- **Theme switching**: Support multiple brands with same structure")
    md.append("- **Context awareness**: Colors adapt to interaction state, background level, etc.")
    md.append("- **Accessibility**: Automated A11Y variants at each level")
    md.append("")
    
    # Statistics Overview
    md.append("---")
    md.append("")
    md.append("## Statistics Overview")
    md.append("")
    md.append("### Variables by Collection")
    md.append("")
    md.append("| Collection | Variables | Purpose |")
    md.append("|------------|-----------|---------|")
    
    collection_descriptions = {
        '00_Primitives': 'Base RGB color values',
        '00_Semi semantics': 'Named color scales (Grey/2500, Indigo/300, etc.)',
        '02 Colour Mode': 'Light/Dark theme variations',
        '4 Interaction state': 'Idle/Hover/Pressed/Focus states',
        '3 Background Level': 'Surface elevation levels',
        '2 Fill emphasis': 'Ghost/Minimal/Subtle/Bold styles',
        '1 Appearance': 'Semantic contexts (Primary/Secondary/etc.)',
        '9 Theme': 'Brand themes (MyJio/JioFinance/JioHome)',
        '10 Brand': 'Brand-specific tokens'
    }
    
    for collection_name, count in stats['variables_by_collection'].items():
        desc = collection_descriptions.get(collection_name, 'Other variables')
        md.append(f"| {collection_name} | {count:,} | {desc} |")
    
    md.append("")
    md.append("### Variables by Type")
    md.append("")
    for var_type, count in stats['variables_by_type'].items():
        md.append(f"- **{var_type}**: {count:,} variables")
    md.append("")
    md.append("### Alias Statistics")
    md.append("")
    alias_stats = stats['alias_statistics']
    md.append(f"- **Total Alias References**: {alias_stats['total_aliases']:,}")
    md.append(f"- **Direct Color Values**: {alias_stats['direct_values']:,}")
    md.append(f"- **Alias Percentage**: {alias_stats['alias_percentage']}%")
    md.append("")
    md.append("The high alias percentage (94%+) indicates a well-structured token system where most")
    md.append("variables reference others rather than hardcoding values. This creates a single source")
    md.append("of truth and makes system-wide updates manageable.")
    md.append("")
    
    # Collection Architecture
    md.append("---")
    md.append("")
    md.append("## Collection Architecture")
    md.append("")
    md.append("### Hierarchy Diagram")
    md.append("")
    md.append("```mermaid")
    md.append("graph TD")
    md.append("    Primitives[00_Primitives<br/>25 vars]")
    md.append("    SemiSem[00_Semi semantics<br/>2688 vars]")
    md.append("    ColorMode[02 Colour Mode<br/>4614 vars]")
    md.append("    Interaction[4 Interaction state<br/>2280 vars]")
    md.append("    BgLevel[3 Background Level<br/>442 vars]")
    md.append("    FillEmp[2 Fill emphasis<br/>120 vars]")
    md.append("    Appearance[1 Appearance<br/>41 vars]")
    md.append("    Theme[9 Theme<br/>224 vars]")
    md.append("    Brand[10 Brand<br/>618 vars]")
    md.append("")
    md.append("    Primitives --> SemiSem")
    md.append("    SemiSem --> ColorMode")
    md.append("    ColorMode --> Interaction")
    md.append("    ColorMode --> BgLevel")
    md.append("    ColorMode --> FillEmp")
    md.append("    Interaction --> Appearance")
    md.append("    BgLevel --> Appearance")
    md.append("    FillEmp --> Appearance")
    md.append("    Appearance --> Theme")
    md.append("    Theme --> Brand")
    md.append("```")
    md.append("")
    md.append("### Collection Details")
    md.append("")
    
    # Group collections by level
    collections_by_level = {}
    for collection in rules['collection_hierarchy']:
        level = collection['level']
        if level not in collections_by_level:
            collections_by_level[level] = []
        collections_by_level[level].append(collection)
    
    level_names = {
        0: "Level 0: Primitives",
        1: "Level 1: Semi-Semantics",
        2: "Level 2: Color Mode",
        3: "Level 3: Contextual Layers",
        4: "Level 4: Theme",
        5: "Level 5: Brand"
    }
    
    for level in sorted(collections_by_level.keys()):
        if level > 5:
            continue
        md.append(f"#### {level_names.get(level, f'Level {level}')}")
        md.append("")
        
        for collection in collections_by_level[level]:
            md.append(f"**{collection['name']}**")
            md.append(f"- Variables: {collection['variable_count']:,}")
            md.append(f"- Modes: {', '.join([m['name'] for m in collection['modes']])}")
            if collection['default_mode_id']:
                md.append(f"- Default Mode: {collection['default_mode_id']}")
            md.append("")
    
    # Naming Conventions
    md.append("---")
    md.append("")
    md.append("## Naming Conventions")
    md.append("")
    patterns = rules['naming_patterns']
    md.append("### Variable Name Patterns")
    md.append("")
    md.append("The system uses hierarchical naming with `/` as delimiter:")
    md.append("")
    md.append(f"1. **{patterns['variable_format']}**")
    md.append("   - Used in Semi-semantics layer")
    md.append("   - Example: `Grey/2500/Surface`, `Indigo/300/Bold`")
    md.append("")
    md.append(f"2. **{patterns['contextual_format']}**")
    md.append("   - Used in contextual and theme layers")
    md.append("   - Context markers in square brackets: `[Theme]`, `[Colour Mode]`, `[appearance]`")
    md.append("   - Example: `Grey/Semi semantics/Root/[Colour Mode] Surface`")
    md.append("")
    md.append("### Pattern Examples")
    md.append("")
    md.append("| Pattern | Example | Layer |")
    md.append("|---------|---------|-------|")
    for example in patterns['examples']:
        md.append(f"| {example['pattern']} | `{example['example']}` | Various |")
    md.append("")
    
    # Color Scale Numbers
    md.append("### Color Scale Numbers")
    md.append("")
    if patterns['scale_numbers']:
        md.append("Valid scale numbers (from lightest to darkest in light mode):")
        md.append("")
        md.append("```")
        scale_str = ', '.join(str(s) for s in patterns['scale_numbers'][:15])
        md.append(scale_str)
        if len(patterns['scale_numbers']) > 15:
            md.append("... (and more)")
        md.append("```")
        md.append("")
    
    # Context Markers
    md.append("### Context Markers")
    md.append("")
    md.append("Context markers indicate which collection layer a variable belongs to:")
    md.append("")
    for marker in patterns['context_markers']:
        md.append(f"- `[{marker}]`")
    md.append("")
    
    # Color Families
    md.append("### Color Families")
    md.append("")
    md.append("The following color families are used throughout the system:")
    md.append("")
    families_per_line = 6
    for i in range(0, len(patterns['color_families']), families_per_line):
        batch = patterns['color_families'][i:i+families_per_line]
        md.append("- " + ", ".join(f"`{f}`" for f in batch))
    md.append("")
    
    # Mode System
    md.append("---")
    md.append("")
    md.append("## Mode System")
    md.append("")
    md.append("Modes enable multi-dimensional variation of design tokens. Each collection can define")
    md.append("multiple modes, and variables must provide values for all modes in their collection.")
    md.append("")
    
    mode_mappings = rules['mode_mappings']
    
    # Theme Modes
    md.append("### Theme Modes")
    md.append("")
    md.append("Support different brand themes with consistent structure:")
    md.append("")
    md.append("| Theme | Mode ID | Primary | Secondary | Sparkle |")
    md.append("|-------|---------|---------|-----------|---------|")
    for theme_name, theme_info in mode_mappings['theme'].items():
        md.append(f"| {theme_name} | `{theme_info['mode_id']}` | {theme_info['primary_color']} | {theme_info['secondary_color']} | {theme_info['sparkle_color']} |")
    md.append("")
    
    # Color Mode
    md.append("### Color Mode")
    md.append("")
    md.append("Light and Dark theme support:")
    md.append("")
    for mode_name, mode_info in mode_mappings['color_mode'].items():
        md.append(f"- **{mode_name}** (`{mode_info['mode_id']}`): {mode_info['description']}")
    md.append("")
    
    # Interaction States
    md.append("### Interaction States")
    md.append("")
    md.append("Interactive component states:")
    md.append("")
    for state_name, state_info in mode_mappings['interaction_state'].items():
        md.append(f"- **{state_name}** (`{state_info['mode_id']}`): {state_info['description']}")
    md.append("")
    
    # Fill Emphasis
    md.append("### Fill Emphasis")
    md.append("")
    md.append("Visual weight variations:")
    md.append("")
    for fill_name, fill_info in mode_mappings['fill_emphasis'].items():
        md.append(f"- **{fill_name}** (`{fill_info['mode_id']}`): {fill_info['description']}")
    md.append("")
    
    # Background Level
    md.append("### Background Level")
    md.append("")
    md.append("Surface elevation system:")
    md.append("")
    for bg_name, bg_info in mode_mappings['background_level'].items():
        md.append(f"- **{bg_name}** (`{bg_info['mode_id']}`): {bg_info['description']}")
    md.append("")
    
    # Appearance
    md.append("### Appearance")
    md.append("")
    md.append("Semantic appearance contexts:")
    md.append("")
    for app_name, app_info in mode_mappings['appearance'].items():
        md.append(f"- **{app_name}** (`{app_info['mode_id']}`): {app_info['description']}")
    md.append("")
    
    # Alias Resolution
    md.append("---")
    md.append("")
    md.append("## Alias Resolution")
    md.append("")
    md.append("### How Aliasing Works")
    md.append("")
    md.append("Variables can reference other variables instead of hardcoding values. This creates")
    md.append("a dependency graph where changes propagate through the system.")
    md.append("")
    md.append("**Alias Format in JSON:**")
    md.append("```json")
    md.append("{")
    md.append('  "valuesByMode": {')
    md.append('    "23:4": {')
    md.append('      "type": "VARIABLE_ALIAS",')
    md.append('      "id": "VariableID:80:10050"')
    md.append("    }")
    md.append("  }")
    md.append("}")
    md.append("```")
    md.append("")
    md.append("### Example Alias Chain")
    md.append("")
    md.append("Tracing `Jio/Surfaces/[Theme] Surface` in **MyJio** mode:")
    md.append("")
    md.append("```")
    md.append("1. Theme Layer: Jio/Surfaces/[Theme] Surface")
    md.append("   → aliases to: Jio/MyJio/[appearance] Surface")
    md.append("")
    md.append("2. Appearance Layer: Jio/MyJio/[appearance] Surface (in 'Neutral' mode)")
    md.append("   → aliases to: Grey/[Child] Surface")
    md.append("")
    md.append("3. Fill Emphasis Layer: Grey/[Child] Surface (in 'Ghost' mode)")
    md.append("   → aliases to: Grey/Ghost/[Parent] Surface")
    md.append("")
    md.append("4. Background Level Layer: Grey/Ghost/[Parent] Surface (in 'Level 0' mode)")
    md.append("   → aliases to: Grey/Default/Ghost/[Interaction state] Surface")
    md.append("")
    md.append("5. Interaction State Layer: Grey/Default/Ghost/[Interaction state] Surface (in 'Idle' mode)")
    md.append("   → aliases to: Grey/Semi semantics/Root/[Colour Mode] Surface")
    md.append("")
    md.append("6. Color Mode Layer: Grey/Semi semantics/Root/[Colour Mode] Surface (in 'Light' mode)")
    md.append("   → aliases to: Grey/2500/Surface")
    md.append("")
    md.append("7. Semi-semantic Layer: Grey/2500/Surface")
    md.append("   → aliases to: Primitive color value")
    md.append("")
    md.append("8. Primitive Layer: RGB(0.92, 0.92, 0.93, 1.0)")
    md.append("```")
    md.append("")
    md.append("This 8-level chain demonstrates the full depth of the system architecture.")
    md.append("")
    
    # Color Scale Pattern
    md.append("---")
    md.append("")
    md.append("## Color Scale Pattern")
    md.append("")
    auto_rules = rules['automation_rules']
    scale_rule = auto_rules.get('rule_001_scale_pattern', {})
    
    md.append("### Numbering System")
    md.append("")
    md.append(f"**Rule**: {scale_rule.get('pattern', {}).get('rule', 'N/A')}")
    md.append("")
    md.append("### Light Mode Progression")
    md.append("")
    md.append("Higher numbers = Lighter colors:")
    md.append("")
    md.append("```")
    md.append("2500 (Lightest) → 2400 → 2300 → ... → 200 → 100 (Darkest)")
    md.append("```")
    md.append("")
    md.append("Example for Grey family:")
    md.append("- `Grey/2500/Surface`: Almost white (#EBEBEC)")
    md.append("- `Grey/1200/Surface`: Mid grey")
    md.append("- `Grey/100/Surface`: Almost black")
    md.append("")
    md.append("### Dark Mode Progression")
    md.append("")
    md.append("Lower numbers = Lighter colors (inverted):")
    md.append("")
    md.append("```")
    md.append("100 (Lightest) → 200 → 300 → ... → 2400 → 2500 (Darkest)")
    md.append("```")
    md.append("")
    md.append("This inversion ensures semantic consistency: 'Surface' is always light relative to 'Bold'.")
    md.append("")
    
    # MyJio Brand Specifics
    md.append("---")
    md.append("")
    md.append("## MyJio Brand Specifics")
    md.append("")
    brand_specs = rules['brand_specifics']['MyJio']
    
    md.append(f"**Theme Mode ID**: `{brand_specs['theme_mode_id']}`")
    md.append("")
    md.append("### Primary Color")
    md.append("")
    md.append(f"- **Family**: {brand_specs['primary_color']['family']}")
    md.append(f"- **Description**: {brand_specs['primary_color']['description']}")
    md.append("")
    md.append("### Secondary Color")
    md.append("")
    md.append(f"- **Family**: {brand_specs['secondary_color']['family']}")
    md.append(f"- **Description**: {brand_specs['secondary_color']['description']}")
    md.append("")
    md.append("### Sparkle Color")
    md.append("")
    md.append(f"- **Family**: {brand_specs['sparkle_color']['family']}")
    md.append(f"- **Description**: {brand_specs['sparkle_color']['description']}")
    md.append("")
    md.append("### Neutral Color")
    md.append("")
    md.append(f"- **Family**: {brand_specs['neutral_color']['family']}")
    md.append(f"- **Description**: {brand_specs['neutral_color']['description']}")
    md.append("")
    md.append("### Semantic Colors")
    md.append("")
    for semantic, desc in brand_specs['semantic_colors'].items():
        md.append(f"- **{semantic.title()}**: {desc}")
    md.append("")
    md.append("### Data Visualization Palette")
    md.append("")
    datavis = brand_specs['datavis_palette']
    md.append(f"- **Categorical Bold**: {', '.join(datavis['categorical_bold'])}")
    md.append(f"- **Categorical Subtle**: {datavis['categorical_subtle']}")
    md.append(f"- **Monochromatic**: {datavis['monochromatic']}")
    md.append(f"- **Diverging Semantic**: {datavis['diverging_semantic']}")
    md.append(f"- **Diverging Brand**: {datavis['diverging_brand']}")
    md.append("")
    
    # Automation Rules
    md.append("---")
    md.append("")
    md.append("## Automation Rules")
    md.append("")
    md.append("These rules can be used to automate variable creation, validation, and bulk operations.")
    md.append("")
    
    for rule_id, rule in auto_rules.items():
        md.append(f"### {rule['name']}")
        md.append("")
        md.append(f"**ID**: `{rule['id']}`  ")
        md.append(f"**Category**: {rule['category']}")
        md.append("")
        md.append(f"**Description**: {rule['description']}")
        md.append("")
        
        if 'pattern' in rule:
            md.append("**Pattern:**")
            md.append("```json")
            md.append(json.dumps(rule['pattern'], indent=2))
            md.append("```")
            md.append("")
        
        if 'validation' in rule:
            md.append("**Validation:**")
            md.append(f"- Check: {rule['validation']['check']}")
            md.append(f"- Fix: {rule['validation']['fix']}")
            md.append("")
    
    # Implementation Guide
    md.append("---")
    md.append("")
    md.append("## Implementation Guide")
    md.append("")
    md.append("### Use Case 1: Add New Brand")
    md.append("")
    md.append("To add a new brand (e.g., 'JioBusiness'):")
    md.append("")
    md.append("1. **Add mode to Theme collection** (`9 Theme`)")
    md.append("   - Create new mode: 'JioBusiness'")
    md.append("   - Get new mode ID (e.g., `1500:0`)")
    md.append("")
    md.append("2. **Create Appearance mappings**")
    md.append("   - Add variables like `Jio/JioBusiness/[appearance] Surface`")
    md.append("   - Map to appropriate color families:")
    md.append("     - Primary → Choose color family (e.g., Blue)")
    md.append("     - Secondary → Choose color family (e.g., Orange)")
    md.append("     - Sparkle → Choose color family (e.g., Purple)")
    md.append("")
    md.append("3. **Update Theme variables**")
    md.append("   - Add `valuesByMode` entry for new mode ID")
    md.append("   - Alias to new appearance variables")
    md.append("")
    md.append("4. **Create DataVis palette** (optional)")
    md.append("   - Add `DataVis/JioBusiness/*` variables")
    md.append("   - Define categorical, monochromatic, diverging palettes")
    md.append("")
    md.append("### Use Case 2: Create New Color Family")
    md.append("")
    md.append("To add a new color family (e.g., 'Teal'):")
    md.append("")
    md.append("1. **Add primitives** (optional, if not using existing)")
    md.append("   - Add RGB values to `00_Primitives`")
    md.append("")
    md.append("2. **Create semi-semantic scale**")
    md.append("   - Add to `00_Semi semantics`:")
    md.append("     - `Teal/2500/Surface`, `Teal/2500/High`, ..., `Teal/2500/Minimal`")
    md.append("     - `Teal/2400/...`, `Teal/2300/...`, etc.")
    md.append("     - Down to `Teal/100/...`")
    md.append("   - Total: ~336 variables (24 scales × 14 properties)")
    md.append("")
    md.append("3. **Create Color Mode variants**")
    md.append("   - Add to `02 Colour Mode`:")
    md.append("     - `Teal/Semi semantics/Root/[Colour Mode] Surface`")
    md.append("     - Light mode → `Teal/2500/Surface`")
    md.append("     - Dark mode → `Teal/200/Surface`")
    md.append("   - Create all scale progressions (Root, Root+1, Root+2, etc.)")
    md.append("")
    md.append("4. **Wire through contextual layers**")
    md.append("   - Interaction State: Map idle/hover/pressed/focus")
    md.append("   - Background Level: Map Level 0/1/2/Bold/Elevated")
    md.append("   - Fill Emphasis: Map Ghost/Minimal/Subtle/Bold")
    md.append("   - Appearance: Make available in appearance contexts")
    md.append("")
    md.append("### Use Case 3: Update Brand Colors")
    md.append("")
    md.append("To change MyJio's primary color from Indigo to Blue:")
    md.append("")
    md.append("1. **Locate Appearance mapping**")
    md.append("   - Find: `Jio/MyJio/[appearance] Surface` in `1 Appearance`")
    md.append("   - Current: Primary mode → aliases to `Indigo/[Child] Surface`")
    md.append("")
    md.append("2. **Update alias target**")
    md.append("   - Change to: `Blue/[Child] Surface`")
    md.append("   - Repeat for all properties (High, Medium, Low, etc.)")
    md.append("")
    md.append("3. **Propagate changes**")
    md.append("   - All Theme and Brand layer variables automatically update")
    md.append("   - No changes needed in other layers (power of aliasing!)")
    md.append("")
    
    # Appendix
    md.append("---")
    md.append("")
    md.append("## Appendix: Example Variables")
    md.append("")
    md.append("### Example 1: Simple Primitive")
    md.append("")
    md.append("```json")
    md.append("{")
    md.append('  "id": "VariableID:817:1779",')
    md.append('  "name": "Transparancy/Light/2500",')
    md.append('  "resolvedType": "COLOR",')
    md.append('  "valuesByMode": {')
    md.append('    "817:0": {')
    md.append('      "r": 0.92,')
    md.append('      "g": 0.92,')
    md.append('      "b": 0.93,')
    md.append('      "a": 0')
    md.append("    }")
    md.append("  }")
    md.append("}")
    md.append("```")
    md.append("")
    md.append("### Example 2: Semi-Semantic with Alias")
    md.append("")
    md.append("```json")
    md.append("{")
    md.append('  "id": "VariableID:23:24070",')
    md.append('  "name": "Grey/2500/Surface",')
    md.append('  "resolvedType": "COLOR",')
    md.append('  "valuesByMode": {')
    md.append('    "23:2": {')
    md.append('      "type": "VARIABLE_ALIAS",')
    md.append('      "id": "VariableID:ad101ff26003061334ff03bd47f836f01532d1e8/1250:4037"')
    md.append("    }")
    md.append("  }")
    md.append("}")
    md.append("```")
    md.append("")
    md.append("### Example 3: Multi-Mode Theme Variable")
    md.append("")
    md.append("```json")
    md.append("{")
    md.append('  "id": "VariableID:80:10041",')
    md.append('  "name": "Jio/Surfaces/[Theme] Surface",')
    md.append('  "resolvedType": "COLOR",')
    md.append('  "valuesByMode": {')
    md.append('    "23:4": {')
    md.append('      "type": "VARIABLE_ALIAS",')
    md.append('      "id": "VariableID:80:10050"  // MyJio mode')
    md.append("    },")
    md.append('    "633:0": {')
    md.append('      "type": "VARIABLE_ALIAS",')
    md.append('      "id": "VariableID:1101:116379"  // JioFinance mode')
    md.append("    },")
    md.append('    "1292:0": {')
    md.append('      "type": "VARIABLE_ALIAS",')
    md.append('      "id": "VariableID:1292:111464"  // JioHome mode')
    md.append("    }")
    md.append("  }")
    md.append("}")
    md.append("```")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## Additional Resources")
    md.append("")
    md.append("- **JSON Automation Rules**: See `myjio_color_automation_rules.json`")
    md.append("- **Analysis Scripts**: ")
    md.append("  - `analyze_myjio_colors.py` - Collection hierarchy analysis")
    md.append("  - `deep_alias_trace.py` - Alias chain tracing")
    md.append("  - `generate_mapping_rules.py` - Rule extraction")
    md.append("  - `create_documentation.py` - This documentation generator")
    md.append("")
    md.append("---")
    md.append("")
    md.append(f"*Generated on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}*")
    md.append("")
    
    return '\n'.join(md)

def main():
    print("Loading automation rules...")
    rules = load_automation_rules()
    
    print("Generating Markdown documentation...")
    markdown = generate_markdown_doc(rules)
    
    # Write to file
    output_path = '/Users/upendranath.kaki/Desktop/Codes/VarCar/VarCar/docs/MYJIO_COLOR_MAPPING_ANALYSIS.md'
    with open(output_path, 'w') as f:
        f.write(markdown)
    
    print(f"\n✅ Markdown documentation generated: {output_path}")
    print(f"   Total lines: {len(markdown.split(chr(10)))}")
    print(f"   Total characters: {len(markdown):,}")
    
    # Summary
    print("\n" + "="*80)
    print("DOCUMENTATION GENERATION COMPLETE")
    print("="*80)
    print("\nGenerated files:")
    print("  1. myjio_color_automation_rules.json (machine-readable rules)")
    print("  2. VarCar/docs/MYJIO_COLOR_MAPPING_ANALYSIS.md (comprehensive guide)")
    print("\nAnalysis scripts:")
    print("  - analyze_myjio_colors.py")
    print("  - deep_alias_trace.py")
    print("  - generate_mapping_rules.py")
    print("  - create_documentation.py")
    print("\n" + "="*80)

if __name__ == "__main__":
    main()
