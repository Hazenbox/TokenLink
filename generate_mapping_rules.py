#!/usr/bin/env python3
"""
Generate automation rules from MyJio color variable analysis
Extracts patterns, mappings, and validation rules into structured JSON format
"""
import json
from typing import Dict, List, Any, Set, Tuple
from collections import defaultdict
from datetime import datetime

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

def extract_collection_hierarchy(data: Dict) -> List[Dict]:
    """Extract the collection hierarchy with dependency information"""
    collections = []
    
    # Define hierarchy levels based on analysis
    level_mapping = {
        '00_Primitives': 0,
        '00_Semi semantics': 1,
        '02 Colour Mode': 2,
        '4 Interaction state': 3,
        '3 Background Level': 3,
        '2 Fill emphasis': 3,
        '1 Appearance': 3,
        '9 Theme': 4,
        '10 Brand': 5,
    }
    
    for collection in data['collections']:
        name = collection['name']
        level = level_mapping.get(name, 99)  # Unknown collections get high level
        
        collections.append({
            'id': collection['id'],
            'name': name,
            'level': level,
            'variable_count': len(collection.get('variables', [])),
            'modes': [{'name': m['name'], 'id': m['modeId']} for m in collection['modes']],
            'default_mode_id': collection.get('defaultModeId'),
            'remote': collection.get('remote', False)
        })
    
    # Sort by level
    collections.sort(key=lambda x: (x['level'], x['name']))
    
    return collections

def extract_naming_patterns(data: Dict, var_index: Dict) -> Dict:
    """Extract naming convention patterns from variables"""
    patterns = {
        'variable_format': '{ColorFamily}/{Scale}/{Property}',
        'contextual_format': '{Category}/{Subcategory}/[Context] {Property}',
        'examples': [],
        'scale_numbers': [],
        'context_markers': set(),
        'property_types': set(),
        'color_families': set()
    }
    
    # Analyze semi-semantics for scale patterns
    semi_sem = next((c for c in data['collections'] if c['name'] == '00_Semi semantics'), None)
    if semi_sem:
        scale_numbers = set()
        for var in semi_sem['variables'][:100]:  # Sample
            name = var['name']
            parts = name.split('/')
            if len(parts) >= 2 and parts[1].isdigit():
                scale_numbers.add(int(parts[1]))
            if len(parts) >= 1:
                patterns['color_families'].add(parts[0])
            if len(parts) >= 3:
                patterns['property_types'].add(parts[2])
        
        patterns['scale_numbers'] = sorted(list(scale_numbers), reverse=True)
    
    # Extract context markers
    theme_collection = next((c for c in data['collections'] if c['name'] == '9 Theme'), None)
    if theme_collection:
        for var in theme_collection['variables'][:50]:
            name = var['name']
            # Find [Context] markers
            import re
            contexts = re.findall(r'\[([^\]]+)\]', name)
            patterns['context_markers'].update(contexts)
    
    # Convert sets to sorted lists for JSON serialization
    patterns['context_markers'] = sorted(list(patterns['context_markers']))
    patterns['property_types'] = sorted(list(patterns['property_types']))
    patterns['color_families'] = sorted(list(patterns['color_families']))
    
    # Add examples
    patterns['examples'] = [
        {'pattern': 'Semi-semantic', 'example': 'Grey/2500/Surface'},
        {'pattern': 'Contextual', 'example': 'Grey/Semi semantics/Root/[Colour Mode] Surface'},
        {'pattern': 'Theme', 'example': 'Jio/Surfaces/[Theme] Surface'},
        {'pattern': 'Appearance', 'example': 'Jio/MyJio/[appearance] Surface'},
        {'pattern': 'DataVis', 'example': 'DataVis/MyJio/categorical/bold/1'}
    ]
    
    return patterns

def extract_mode_mappings(data: Dict, var_index: Dict) -> Dict:
    """Extract mode mappings for different brands/themes"""
    mappings = {
        'theme': {},
        'color_mode': {},
        'interaction_state': {},
        'fill_emphasis': {},
        'background_level': {},
        'appearance': {}
    }
    
    # Theme mappings (MyJio, JioFinance, JioHome)
    theme_collection = next((c for c in data['collections'] if c['name'] == '9 Theme'), None)
    if theme_collection:
        for mode in theme_collection['modes']:
            mode_name = mode['name']
            mappings['theme'][mode_name] = {
                'mode_id': mode['modeId'],
                'primary_color': 'Indigo' if mode_name == 'MyJio' else 'Unknown',
                'secondary_color': 'Saffron' if mode_name == 'MyJio' else 'Unknown',
                'sparkle_color': 'Green' if mode_name == 'MyJio' else 'Unknown'
            }
    
    # Color Mode mappings
    color_mode = next((c for c in data['collections'] if c['name'] == '02 Colour Mode'), None)
    if color_mode:
        for mode in color_mode['modes']:
            mappings['color_mode'][mode['name']] = {
                'mode_id': mode['modeId'],
                'description': f"{mode['name']} theme colors"
            }
    
    # Interaction State mappings
    interaction = next((c for c in data['collections'] if c['name'] == '4 Interaction state'), None)
    if interaction:
        for mode in interaction['modes']:
            mappings['interaction_state'][mode['name']] = {
                'mode_id': mode['modeId'],
                'description': f"{mode['name']} state"
            }
    
    # Fill Emphasis mappings
    fill = next((c for c in data['collections'] if c['name'] == '2 Fill emphasis'), None)
    if fill:
        for mode in fill['modes']:
            mappings['fill_emphasis'][mode['name']] = {
                'mode_id': mode['modeId'],
                'description': f"{mode['name']} emphasis style"
            }
    
    # Background Level mappings
    bg_level = next((c for c in data['collections'] if c['name'] == '3 Background Level'), None)
    if bg_level:
        for mode in bg_level['modes']:
            mappings['background_level'][mode['name']] = {
                'mode_id': mode['modeId'],
                'description': f"Background {mode['name']}"
            }
    
    # Appearance mappings
    appearance = next((c for c in data['collections'] if c['name'] == '1 Appearance'), None)
    if appearance:
        for mode in appearance['modes']:
            mappings['appearance'][mode['name']] = {
                'mode_id': mode['modeId'],
                'description': f"{mode['name']} appearance"
            }
    
    return mappings

def extract_automation_rules(data: Dict, var_index: Dict) -> Dict:
    """Extract automation rules based on observed patterns"""
    rules = {}
    
    # Rule 001: Scale Pattern
    rules['rule_001_scale_pattern'] = {
        'id': 'SCALE_PATTERN',
        'name': 'Color Scale Numbering Pattern',
        'category': 'scale',
        'description': 'Defines valid color scale numbers and their progression',
        'pattern': {
            'light_mode_progression': [2500, 2400, 2300, 2200, 2100, 2000, 1900, 1800, 1700, 1600, 1500, 1400, 1300, 1200, 1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100],
            'dark_mode_progression': [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500],
            'rule': 'Light mode: higher numbers = lighter colors. Dark mode: lower numbers = lighter colors.'
        },
        'validation': {
            'check': 'Variable name contains valid scale number',
            'fix': 'Use closest valid scale number'
        }
    }
    
    # Rule 002: Interaction States
    rules['rule_002_interaction_states'] = {
        'id': 'INTERACTION_STATES',
        'name': 'Interaction State Mapping',
        'category': 'mode_consistency',
        'description': 'Defines how interaction states map to color scale progression',
        'pattern': {
            'idle': 'Root scale (e.g., Grey/2500)',
            'hover': 'Root +1 (e.g., Grey/2400)',
            'pressed': 'Root +2 (e.g., Grey/2300)',
            'focus': 'Root (same as idle)'
        },
        'validation': {
            'check': 'All interaction state modes have appropriate scale references',
            'fix': 'Map to correct scale based on state'
        }
    }
    
    # Rule 003: Mode Branching
    rules['rule_003_mode_branching'] = {
        'id': 'MODE_BRANCHING',
        'name': 'Multi-Mode Variable Consistency',
        'category': 'mode_consistency',
        'description': 'All variables in a collection must define values for all modes',
        'pattern': {
            'requirement': 'valuesByMode must have entry for each mode in collection.modes',
            'exception': 'None - all modes must be defined'
        },
        'validation': {
            'check': 'Variable has value defined for every mode in its collection',
            'fix': 'Add missing mode entries with appropriate aliases or values'
        }
    }
    
    # Rule 004: Alias Chain Depth
    rules['rule_004_alias_depth'] = {
        'id': 'ALIAS_DEPTH',
        'name': 'Maximum Alias Chain Depth',
        'category': 'alias',
        'description': 'Prevents infinite loops and excessive indirection',
        'pattern': {
            'max_depth': 50,
            'typical_depth': '7-15 levels',
            'chain_structure': 'Theme → Appearance → Fill → Background → Interaction → Color Mode → Semi-semantic → Primitive'
        },
        'validation': {
            'check': 'Alias chain resolves within max_depth',
            'fix': 'Identify circular reference or excessive indirection'
        }
    }
    
    # Rule 005: Context Markers
    rules['rule_005_context_markers'] = {
        'id': 'CONTEXT_MARKERS',
        'name': 'Context Marker Convention',
        'category': 'naming',
        'description': 'Variables use [Context] markers to indicate collection layer',
        'pattern': {
            'markers': ['[Theme]', '[Colour Mode]', '[Interaction state]', '[appearance]', '[Parent]', '[Child]'],
            'format': 'Category/Subcategory/[Context] Property',
            'case': 'Context names may be lowercase or Title Case'
        },
        'validation': {
            'check': 'Variables in contextual collections use appropriate [Context] marker',
            'fix': 'Add correct context marker based on collection'
        }
    }
    
    # Rule 006: Collection Dependencies
    rules['rule_006_collection_dependencies'] = {
        'id': 'COLLECTION_DEPENDENCIES',
        'name': 'Valid Cross-Collection References',
        'category': 'collection_dependency',
        'description': 'Defines which collections can reference variables from which other collections',
        'pattern': {
            'hierarchy': {
                'Primitives': {'can_reference': []},
                'Semi-semantics': {'can_reference': ['Primitives']},
                'Color Mode': {'can_reference': ['Semi-semantics', 'Primitives']},
                'Contextual': {'can_reference': ['Color Mode', 'Semi-semantics', 'Primitives']},
                'Theme': {'can_reference': ['Contextual', 'Color Mode', 'Semi-semantics', 'Primitives']},
                'Brand': {'can_reference': ['Theme', 'Contextual', 'Color Mode', 'Semi-semantics', 'Primitives']}
            }
        },
        'validation': {
            'check': 'Alias references only target variables from allowed collections',
            'fix': 'Update alias to reference appropriate collection layer'
        }
    }
    
    # Rule 007: Color Family Consistency
    rules['rule_007_color_family'] = {
        'id': 'COLOR_FAMILY',
        'name': 'Color Family Naming Consistency',
        'category': 'naming',
        'description': 'Color families follow consistent naming across all collections',
        'pattern': {
            'families': ['Grey', 'Indigo', 'Saffron', 'Green', 'Orange', 'Purple', 'Sky', 'Cabbage', 'Gold', 'Positive', 'Negative', 'Warning', 'Informative'],
            'format': '{Family}/{Scale or Context}/{Property}',
            'properties': ['Surface', 'High', 'Medium', 'Low', 'Heavy', 'Bold', 'Bold A11Y', 'Minimal']
        },
        'validation': {
            'check': 'Variable name starts with valid color family',
            'fix': 'Use standard color family name'
        }
    }
    
    # Rule 008: DataVis Palette Structure
    rules['rule_008_datavis_palette'] = {
        'id': 'DATAVIS_PALETTE',
        'name': 'Data Visualization Palette Structure',
        'category': 'naming',
        'description': 'DataVis variables follow specific categorical/monochromatic/diverging patterns',
        'pattern': {
            'format': 'DataVis/{Brand}/{Type}/{Variant}/{Number}',
            'types': ['categorical', 'monochromatic', 'divergingSemantic', 'divergingBrand', 'core'],
            'categorical_variants': ['bold', 'subtle'],
            'categorical_count': 6,
            'monochromatic_categories': 6,
            'monochromatic_steps': 5,
            'diverging_steps': 11
        },
        'validation': {
            'check': 'DataVis variables follow structure with valid type and count',
            'fix': 'Rename to match DataVis naming convention'
        }
    }
    
    return rules

def extract_brand_specifics(data: Dict, var_index: Dict) -> Dict:
    """Extract MyJio-specific color mappings"""
    brand_info = {
        'MyJio': {
            'theme_mode_id': '23:4',
            'primary_color': {
                'family': 'Indigo',
                'description': 'Primary brand color used for key actions and emphasis'
            },
            'secondary_color': {
                'family': 'Saffron',
                'description': 'Secondary brand color for accents and variety'
            },
            'sparkle_color': {
                'family': 'Green',
                'description': 'Special highlight color for positive actions'
            },
            'neutral_color': {
                'family': 'Grey',
                'description': 'Neutral colors for surfaces and text'
            },
            'semantic_colors': {
                'informative': 'Informative family (blue tones)',
                'positive': 'Positive family (green tones)',
                'negative': 'Negative family (red tones)',
                'warning': 'Warning family (yellow/orange tones)'
            },
            'datavis_palette': {
                'categorical_bold': ['Orange', 'Purple', 'Blue', 'Cyan', 'Teal', 'Yellow'],
                'categorical_subtle': ['Light variants of categorical bold'],
                'monochromatic': '6 categories with 5 steps each',
                'diverging_semantic': '11-step scale from negative to positive',
                'diverging_brand': '11-step scale from secondary to primary'
            }
        }
    }
    
    return brand_info

def generate_statistics(data: Dict, var_index: Dict) -> Dict:
    """Generate statistics about the variable structure"""
    stats = {
        'total_variables': len(var_index),
        'total_collections': len(data['collections']),
        'variables_by_collection': {},
        'variables_by_type': {},
        'alias_statistics': {
            'total_aliases': 0,
            'direct_values': 0,
            'alias_percentage': 0.0
        }
    }
    
    # Count by collection
    for collection in data['collections']:
        name = collection['name']
        vars = collection.get('variables', [])
        stats['variables_by_collection'][name] = len(vars)
    
    # Count by type and alias usage
    for var_id, var in var_index.items():
        var_type = var.get('resolvedType', 'UNKNOWN')
        stats['variables_by_type'][var_type] = stats['variables_by_type'].get(var_type, 0) + 1
        
        # Check for aliases
        for mode_id, value in var.get('valuesByMode', {}).items():
            if isinstance(value, dict) and value.get('type') == 'VARIABLE_ALIAS':
                stats['alias_statistics']['total_aliases'] += 1
            elif isinstance(value, dict) and 'r' in value:
                stats['alias_statistics']['direct_values'] += 1
    
    total = stats['alias_statistics']['total_aliases'] + stats['alias_statistics']['direct_values']
    if total > 0:
        stats['alias_statistics']['alias_percentage'] = round(
            (stats['alias_statistics']['total_aliases'] / total) * 100, 1
        )
    
    return stats

def main():
    print("Loading data...")
    data = load_data()
    
    print("Building indexes...")
    var_index, collection_index = build_variable_index(data)
    
    print("Extracting automation rules...")
    
    # Build the complete rules structure
    automation_rules = {
        'metadata': {
            'source_file': 'OneUI Foundations [POC]-variables-full.json',
            'analysis_date': datetime.now().strftime('%Y-%m-%d'),
            'tool': 'VarCar Color Mapping Analysis',
            'version': '1.0.0'
        },
        'statistics': generate_statistics(data, var_index),
        'collection_hierarchy': extract_collection_hierarchy(data),
        'naming_patterns': extract_naming_patterns(data, var_index),
        'mode_mappings': extract_mode_mappings(data, var_index),
        'automation_rules': extract_automation_rules(data, var_index),
        'brand_specifics': extract_brand_specifics(data, var_index)
    }
    
    # Write to JSON file
    output_path = '/Users/upendranath.kaki/Desktop/Codes/VarCar/myjio_color_automation_rules.json'
    with open(output_path, 'w') as f:
        json.dump(automation_rules, f, indent=2)
    
    print(f"\n✅ Automation rules generated: {output_path}")
    print(f"   Total variables: {automation_rules['statistics']['total_variables']}")
    print(f"   Total collections: {automation_rules['statistics']['total_collections']}")
    print(f"   Alias percentage: {automation_rules['statistics']['alias_statistics']['alias_percentage']}%")
    print(f"   Automation rules: {len(automation_rules['automation_rules'])}")

if __name__ == "__main__":
    main()
