#!/usr/bin/env python3
"""
Validate Figma Variable Alias Chains

This script validates that all variable alias chains resolve correctly:
- No broken references
- No circular dependencies
- All chains eventually resolve to color values
- Collections (Appearance, Theme, Fill, etc.) show proper colors

Author: Senior Figma Plugin Engineer
"""

import json
from pathlib import Path
from typing import Dict, Set, List, Tuple, Optional
from collections import defaultdict


class AliasValidator:
    def __init__(self, data: dict):
        self.data = data
        self.variables_by_id: Dict[str, dict] = {}
        self.collections_by_id: Dict[str, dict] = {}
        
        # Build lookup tables
        self._build_lookups()
    
    def _build_lookups(self):
        """Build lookup tables for fast variable resolution"""
        for collection in self.data.get('collections', []):
            self.collections_by_id[collection['id']] = collection
            
            for variable in collection.get('variables', []):
                self.variables_by_id[variable['id']] = variable
    
    def resolve_alias_chain(self, variable_id: str, mode_id: str, visited: Optional[Set[str]] = None) -> Tuple[bool, Optional[dict], List[str]]:
        """
        Resolve an alias chain to its final color value.
        
        Returns:
            (success, final_value, chain_path)
        """
        if visited is None:
            visited = set()
        
        chain_path = []
        
        # Check for circular reference
        if variable_id in visited:
            return (False, None, chain_path + [f"CIRCULAR: {variable_id}"])
        
        visited.add(variable_id)
        
        # Get variable
        variable = self.variables_by_id.get(variable_id)
        if not variable:
            return (False, None, chain_path + [f"NOT_FOUND: {variable_id}"])
        
        chain_path.append(variable.get('name', variable_id))
        
        # Get value for this mode
        values_by_mode = variable.get('valuesByMode', {})
        value = values_by_mode.get(mode_id)
        
        if not value:
            return (False, None, chain_path + [f"NO_VALUE_FOR_MODE: {mode_id}"])
        
        # Check if it's a direct color value
        if isinstance(value, dict) and 'r' in value:
            return (True, value, chain_path)
        
        # Check if it's an alias
        if isinstance(value, dict) and value.get('type') == 'VARIABLE_ALIAS':
            alias_id = value.get('id', '')
            
            # Check for external reference (contains "/")
            if '/' in alias_id:
                return (False, None, chain_path + [f"EXTERNAL_REF: {alias_id}"])
            
            # Resolve the alias
            success, final_value, sub_chain = self.resolve_alias_chain(alias_id, mode_id, visited)
            return (success, final_value, chain_path + sub_chain)
        
        # Unknown value type
        return (False, None, chain_path + [f"UNKNOWN_VALUE_TYPE: {type(value)}"])
    
    def validate_collection(self, collection_name: str) -> Dict:
        """Validate all variables in a collection"""
        results = {
            'collection_name': collection_name,
            'total_variables': 0,
            'valid_chains': 0,
            'broken_chains': 0,
            'circular_refs': 0,
            'external_refs': 0,
            'white_colors': 0,
            'proper_colors': 0,
            'broken_examples': []
        }
        
        # Find collection
        collection = None
        for coll in self.data.get('collections', []):
            if coll.get('name') == collection_name:
                collection = coll
                break
        
        if not collection:
            results['error'] = 'Collection not found'
            return results
        
        # Get modes
        modes = collection.get('modes', [])
        if not modes:
            results['error'] = 'No modes found'
            return results
        
        # Validate each variable
        for variable in collection.get('variables', []):
            results['total_variables'] += 1
            var_name = variable.get('name', '')
            var_id = variable.get('id', '')
            
            # Check first mode
            mode_id = modes[0]['modeId']
            
            success, final_value, chain_path = self.resolve_alias_chain(var_id, mode_id)
            
            if success:
                results['valid_chains'] += 1
                
                # Check if color is white (the bug we fixed)
                if final_value:
                    r = final_value.get('r', 0)
                    g = final_value.get('g', 0)
                    b = final_value.get('b', 0)
                    
                    if r == 1.0 and g == 1.0 and b == 1.0:
                        results['white_colors'] += 1
                    else:
                        results['proper_colors'] += 1
            else:
                results['broken_chains'] += 1
                
                # Classify the error
                if any('CIRCULAR' in step for step in chain_path):
                    results['circular_refs'] += 1
                elif any('EXTERNAL_REF' in step for step in chain_path):
                    results['external_refs'] += 1
                
                # Store example if we don't have too many
                if len(results['broken_examples']) < 5:
                    results['broken_examples'].append({
                        'variable_name': var_name,
                        'chain': ' -> '.join(chain_path)
                    })
        
        return results
    
    def validate_all_critical_collections(self) -> Dict:
        """Validate the critical collections mentioned in the fix"""
        critical_collections = [
            '1 Appearance',
            '2 Fill emphasis',
            '3 Background Level',
            '4 Interaction state',
            '9 Theme',
            '10 Brand'
        ]
        
        all_results = {}
        for collection_name in critical_collections:
            all_results[collection_name] = self.validate_collection(collection_name)
        
        return all_results


def print_validation_results(all_results: Dict):
    """Print validation results in a nice format"""
    print()
    print("=" * 70)
    print("VALIDATION RESULTS")
    print("=" * 70)
    print()
    
    total_valid = 0
    total_broken = 0
    total_white = 0
    total_proper = 0
    
    for collection_name, results in all_results.items():
        if 'error' in results:
            print(f"❌ {collection_name}: {results['error']}")
            continue
        
        total_valid += results['valid_chains']
        total_broken += results['broken_chains']
        total_white += results['white_colors']
        total_proper += results['proper_colors']
        
        status = "✓" if results['broken_chains'] == 0 else "⚠"
        
        print(f"{status} {collection_name}:")
        print(f"   Total variables: {results['total_variables']}")
        print(f"   Valid chains:    {results['valid_chains']}")
        print(f"   Broken chains:   {results['broken_chains']}")
        
        if results['white_colors'] > 0:
            print(f"   ⚠ White colors:  {results['white_colors']}")
        
        if results['proper_colors'] > 0:
            print(f"   ✓ Proper colors: {results['proper_colors']}")
        
        if results['broken_examples']:
            print(f"   Broken examples:")
            for example in results['broken_examples']:
                print(f"     - {example['variable_name']}")
                print(f"       {example['chain']}")
        
        print()
    
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total valid alias chains:  {total_valid}")
    print(f"Total broken alias chains: {total_broken}")
    print(f"White colors remaining:    {total_white}")
    print(f"Proper colors:             {total_proper}")
    print()
    
    if total_broken == 0 and total_white == 0:
        print("✓ All collections validated successfully!")
        print("✓ No white colors found - fix was successful!")
    else:
        if total_broken > 0:
            print(f"⚠ {total_broken} broken alias chains found")
        if total_white > 0:
            print(f"⚠ {total_white} white colors still present")
    
    print()


def main():
    """Main execution"""
    print("=" * 70)
    print("Figma Variable Alias Chain Validation")
    print("=" * 70)
    
    # Path
    workspace = Path("/Users/upendranath.kaki/Desktop/Codes/VarCar")
    variables_file = workspace / "OneUI Foundations [POC]-variables-full.json"
    
    if not variables_file.exists():
        print(f"Error: Variables file not found: {variables_file}")
        return 1
    
    print(f"Loading: {variables_file.name}")
    
    # Load data
    with open(variables_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data.get('collections', []))} collections")
    
    # Validate
    validator = AliasValidator(data)
    all_results = validator.validate_all_critical_collections()
    
    # Print results
    print_validation_results(all_results)
    
    # Return status
    has_issues = any(
        results.get('broken_chains', 0) > 0 or results.get('white_colors', 0) > 0
        for results in all_results.values()
    )
    
    return 1 if has_issues else 0


if __name__ == '__main__':
    exit(main())
