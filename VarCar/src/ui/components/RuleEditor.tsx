/**
 * RuleEditor component - creates and edits rules
 * Enhanced with dropdowns, live preview, and templates
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Rule, createDefaultRule, validateRule, parseAliasPath } from '../../models/rules';
import { createGraph, VariableGraph } from '../../models';
import { findMatchingVariables, resolveTargetVariables, matchVariables } from '../../engine/ruleMatcher';

// Flexible GraphData interface that accepts both App.tsx and model types
interface GraphData {
  collections: Array<{
    id: string;
    name: string;
    type?: string | any;
  }>;
  groups: Array<{
    id: string;
    name: string;
    collectionId: string;
  }>;
  variables: Array<{
    id: string;
    name: string;
    groupId: string;
    variableType?: string;
    modes?: any[];
  }>;
}

interface RuleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Rule) => void;
  initialRule?: Rule;
  graphData?: any; // Optional for backward compatibility - accepts flexible GraphData structure
}

// Rule templates
const RULE_TEMPLATES: Array<{
  id: string;
  name: string;
  description: string;
  template: Partial<Rule>;
}> = [
  {
    id: 'interaction-to-primitive',
    name: 'Interaction States → Primitives',
    description: 'Map hover/active/focus states to base primitive colors',
    template: {
      name: 'Interaction States → Primitives',
      description: 'Automatically alias interaction states to primitive colors',
    },
  },
  {
    id: 'semantic-to-primitive',
    name: 'Semantic → Primitive',
    description: 'Map semantic tokens to primitive colors',
    template: {
      name: 'Semantic → Primitive',
      description: 'Alias semantic tokens to primitive colors',
    },
  },
  {
    id: 'theme-to-semantic',
    name: 'Theme → Semantic',
    description: 'Map theme variables to semantic tokens',
    template: {
      name: 'Theme → Semantic',
      description: 'Alias theme variables to semantic tokens',
    },
  },
];

// ============================================================================
// Extracted Dropdown Component (outside main component to fix React hooks)
// ============================================================================

interface DropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  allowCustom?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ 
  value, 
  options, 
  onChange, 
  placeholder, 
  allowCustom = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          ...styles.input,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          paddingRight: '30px',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ flex: 1, color: value ? 'var(--text-color)' : 'var(--text-secondary)' }}>
          {value || placeholder}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>▼</span>
      </div>
      
      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            {options.length > 5 && (
              <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  style={{
                    ...styles.input,
                    padding: '6px 8px',
                    fontSize: '13px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {allowCustom && (
              <div
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const custom = prompt('Enter custom value:');
                  if (custom !== null) {
                    onChange(custom);
                    setIsOpen(false);
                  }
                }}
              >
                + Custom...
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    backgroundColor: value === opt ? 'var(--secondary-bg)' : 'transparent',
                    color: value === opt ? '#0d99ff' : 'var(--text-color)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--secondary-bg)';
                  }}
                  onMouseLeave={(e) => {
                    if (value !== opt) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {opt}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// Extracted PathBuilder Component (outside main component to fix React hooks)
// ============================================================================

interface PathBuilderProps {
  value: string;
  onChange: (value: string) => void;
  graphData?: any;
  collections: Array<{ id: string; name: string }>;
  targetCollectionNames: string[];
}

const PathBuilder: React.FC<PathBuilderProps> = ({ 
  value, 
  onChange, 
  graphData, 
  collections,
  targetCollectionNames 
}) => {
  // Parse value directly - no state needed (controlled component)
  const parsed = useMemo(() => parseAliasPath(value), [value]);
  const targetCollection = parsed?.collection || '';
  const targetGroup = parsed?.group || '';
  const targetVariable = parsed?.variable || '';

  // Build path helper
  const buildPath = useCallback((coll: string, grp: string, varName: string) => {
    if (!coll || !grp) return '';
    return varName ? `${coll}/${grp}/${varName}` : `${coll}/${grp}`;
  }, []);

  // Event handlers - call onChange immediately (no state updates)
  const handleCollectionChange = useCallback((newCollection: string) => {
    const newPath = buildPath(newCollection, '', '');
    onChange(newPath);
  }, [buildPath, onChange]);

  const handleGroupChange = useCallback((newGroup: string) => {
    const newPath = buildPath(targetCollection, newGroup, '');
    onChange(newPath);
  }, [buildPath, onChange, targetCollection]);

  const handleVariableChange = useCallback((newVariable: string) => {
    const newPath = buildPath(targetCollection, targetGroup, newVariable);
    onChange(newPath);
  }, [buildPath, onChange, targetCollection, targetGroup]);

  const availableGroups = useMemo(() => {
    if (!graphData || !targetCollection) return [];
    if (!graphData.groups || !Array.isArray(graphData.groups)) return [];
    
    try {
      const collection = collections.find(c => c.name === targetCollection);
      if (!collection) return [];
      return graphData.groups
        .filter((g: any) => g && g.collectionId === collection.id)
        .map((g: any) => g.name)
        .filter(Boolean)
        .sort();
    } catch (error) {
      console.error('Error getting available groups:', error);
      return [];
    }
  }, [graphData, targetCollection, collections]);

  const availableVariables = useMemo(() => {
    if (!graphData || !targetCollection || !targetGroup) return [];
    if (!graphData.groups || !graphData.variables) return [];
    if (!Array.isArray(graphData.groups) || !Array.isArray(graphData.variables)) return [];
    
    try {
      const collection = collections.find(c => c.name === targetCollection);
      if (!collection) return [];
      const group = graphData.groups.find(
        (g: any) => g && g.collectionId === collection.id && g.name === targetGroup
      );
      if (!group) return [];
      return graphData.variables
        .filter((v: any) => v && v.groupId === group.id)
        .map((v: any) => v.name)
        .filter(Boolean)
        .sort();
    } catch (error) {
      console.error('Error getting available variables:', error);
      return [];
    }
  }, [graphData, targetCollection, targetGroup, collections]);

  if (!graphData) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
        placeholder="e.g., primitive/default"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Collection</label>
          <Dropdown
            value={targetCollection}
            options={targetCollectionNames}
            onChange={handleCollectionChange}
            placeholder="Select collection"
          />
        </div>
        <div style={{ fontSize: '20px', color: 'var(--text-secondary)', paddingTop: '20px' }}>
          /
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Group</label>
          <Dropdown
            value={targetGroup}
            options={availableGroups}
            onChange={handleGroupChange}
            placeholder="Select group"
            allowCustom={false}
          />
        </div>
      </div>
      {targetGroup && (
        <div>
          <label style={styles.label}>Variable (Optional)</label>
          <Dropdown
            value={targetVariable}
            options={availableVariables}
            onChange={handleVariableChange}
            placeholder="Leave empty for all variables"
            allowCustom={true}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main RuleEditor Component
// ============================================================================

export function RuleEditor({
  isOpen,
  onClose,
  onSave,
  initialRule,
  graphData,
}: RuleEditorProps) {
  const [rule, setRule] = useState<Rule>(initialRule || createDefaultRule());
  const [errors, setErrors] = useState<string[]>([]);
  const [showJSON, setShowJSON] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Build graph from graphData for preview - with error handling
  const graph: VariableGraph | null = useMemo(() => {
    if (!graphData) return null;
    
    try {
      const g = createGraph();
      
      // Convert collections to internal format (with null checks)
      if (graphData.collections && Array.isArray(graphData.collections)) {
        graphData.collections.forEach((col: any) => {
          if (col && col.id && col.name) {
            g.collections.set(col.id, {
              id: col.id,
              name: col.name,
              type: (typeof col.type === 'string' ? col.type : 'primitive') as any,
            });
          }
        });
      }
      
      // Convert groups to internal format (with null checks)
      if (graphData.groups && Array.isArray(graphData.groups)) {
        graphData.groups.forEach((grp: any) => {
          if (grp && grp.id && grp.name && grp.collectionId) {
            g.groups.set(grp.id, {
              id: grp.id,
              name: grp.name,
              collectionId: grp.collectionId,
            });
          }
        });
      }
      
      // Convert variables to internal format (with null checks)
      if (graphData.variables && Array.isArray(graphData.variables)) {
        graphData.variables.forEach((var_: any) => {
          if (var_ && var_.id && var_.name && var_.groupId) {
            g.variables.set(var_.id, {
              id: var_.id,
              name: var_.name,
              groupId: var_.groupId,
              variableType: var_.variableType as any,
              modes: var_.modes || [],
            });
          }
        });
      }
      
      return g;
    } catch (error) {
      console.error('Error building graph for rule preview:', error);
      return null;
    }
  }, [graphData]);

  useEffect(() => {
    if (isOpen) {
      const ruleToEdit = initialRule || createDefaultRule();
      setRule(ruleToEdit);
      setJsonText(JSON.stringify(ruleToEdit, null, 2));
      setErrors([]);
      setShowJSON(false);
      setShowTemplates(false);
    }
  }, [isOpen, initialRule]);

  if (!isOpen) return null;

  const handleSave = () => {
    const validation = validateRule(rule);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onSave(rule);
    onClose();
  };

  const handleJSONSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const validation = validateRule(parsed);
      
      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }

      setRule(parsed);
      setErrors([]);
      onSave(parsed);
      onClose();
    } catch (error) {
      setErrors([`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const updateRule = (updates: Partial<Rule>) => {
    const updated = { ...rule, ...updates };
    setRule(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setErrors([]);
  };

  const updateCondition = (field: 'collection' | 'group', value: string) => {
    updateRule({
      when: {
        ...rule.when,
        [field]: value || undefined,
      },
    });
  };

  const updateAction = useCallback((value: string) => {
    setRule(prevRule => ({
      ...prevRule,
      then: { aliasTo: value }
    }));
    setJsonText(prev => {
      try {
        const parsed = JSON.parse(prev);
        parsed.then = { aliasTo: value };
        return JSON.stringify(parsed, null, 2);
      } catch {
        return prev;
      }
    });
    setErrors([]);
  }, []);

  const applyTemplate = (template: typeof RULE_TEMPLATES[0]) => {
    const newRule = {
      ...createDefaultRule(),
      ...template.template,
      id: rule.id, // Keep existing ID
    };
    setRule(newRule);
    setJsonText(JSON.stringify(newRule, null, 2));
    setShowTemplates(false);
  };

  // Get available collections - memoize to avoid recalculation
  const collections = useMemo(() => graphData?.collections || [], [graphData]);
  const collectionNames = useMemo(() => collections.map(c => c.name).sort(), [collections]);

  // Get available groups (filtered by selected collection if any)
  const availableGroups = useMemo(() => {
    if (!graphData) return [];
    
    if (rule.when.collection) {
      const collection = collections.find(c => c.name === rule.when.collection);
      if (collection) {
        return graphData.groups
          .filter((g: any) => g.collectionId === collection.id)
          .map((g: any) => g.name)
          .sort();
      }
    }
    
    return [...new Set(graphData.groups.map((g: any) => g.name))].sort();
  }, [graphData, rule.when.collection, collections]);

  // Get available target collections
  const targetCollectionNames = useMemo(() => collections.map(c => c.name).sort(), [collections]);

  // Live preview - with error handling
  const preview = useMemo(() => {
    if (!graph) return null;
    if (!rule.when.collection && !rule.when.group) return null;

    try {
      const sourceVars = findMatchingVariables(graph, rule);
      const targetVars = resolveTargetVariables(graph, rule);
      const matchResult = matchVariables(graph, rule);

      return {
        sourceCount: sourceVars.length,
        targetCount: targetVars?.length || 0,
        matches: matchResult.matches || [],
        error: matchResult.error,
        sourceVars: sourceVars.slice(0, 10), // Limit preview
        targetVars: targetVars?.slice(0, 10) || [],
      };
    } catch (error) {
      return {
        sourceCount: 0,
        targetCount: 0,
        matches: [],
        error: error instanceof Error ? error.message : 'Preview error',
        sourceVars: [],
        targetVars: [],
      };
    }
  }, [graph, rule]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {initialRule ? 'Edit Rule' : 'Create New Rule'}
          </h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(showJSON ? {} : styles.activeTab),
            }}
            onClick={() => setShowJSON(false)}
          >
            Form
          </button>
          <button
            style={{
              ...styles.tab,
              ...(showJSON ? styles.activeTab : {}),
            }}
            onClick={() => setShowJSON(true)}
          >
            JSON
          </button>
        </div>

        <div style={styles.content}>
          {!showJSON ? (
            // Form View
            <div style={styles.form}>
              {/* Templates */}
              {!initialRule && !showTemplates && (
                <div style={styles.templateSection}>
                  <button
                    style={styles.templateButton}
                    onClick={() => setShowTemplates(true)}
                  >
                    📋 Browse Templates
                  </button>
                </div>
              )}

              {showTemplates && (
                <div style={styles.templates}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={styles.sectionTitle}>Rule Templates</h3>
                    <button
                      style={styles.closeButton}
                      onClick={() => setShowTemplates(false)}
                    >
                      ✕
                    </button>
                  </div>
                  {RULE_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      style={styles.templateCard}
                      onClick={() => applyTemplate(template)}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                        {template.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {template.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.field}>
                <label style={styles.label}>Rule Name *</label>
                <input
                  type="text"
                  value={rule.name}
                  onChange={(e) => updateRule({ name: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., Hover states to primitives"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={rule.description || ''}
                  onChange={(e) => updateRule({ description: e.target.value })}
                  style={styles.textarea}
                  placeholder="Explain what this rule does..."
                  rows={2}
                />
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>When (Condition)</h3>
                <p style={styles.sectionHint}>
                  Match variables by collection and/or group name
                </p>

                <div style={styles.field}>
                  <label style={styles.label}>Collection Name</label>
                  {graphData ? (
                    <Dropdown
                      value={rule.when.collection || ''}
                      options={collectionNames}
                      onChange={(val) => updateCondition('collection', val)}
                      placeholder="Select or type collection name"
                    />
                  ) : (
                    <input
                      type="text"
                      value={rule.when.collection || ''}
                      onChange={(e) => updateCondition('collection', e.target.value)}
                      style={styles.input}
                      placeholder="e.g., interaction"
                    />
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Group Name</label>
                  {graphData ? (
                    <Dropdown
                      value={rule.when.group || ''}
                      options={availableGroups}
                      onChange={(val) => updateCondition('group', val)}
                      placeholder="Select or type group name"
                    />
                  ) : (
                    <input
                      type="text"
                      value={rule.when.group || ''}
                      onChange={(e) => updateCondition('group', e.target.value)}
                      style={styles.input}
                      placeholder="e.g., hover"
                    />
                  )}
                </div>

                {/* Preview for source */}
                {preview && preview.sourceCount > 0 && (
                  <div style={styles.previewBox}>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                      📊 Preview: {preview.sourceCount} variable{preview.sourceCount !== 1 ? 's' : ''} matched
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', maxHeight: '100px', overflowY: 'auto' }}>
                      {preview.sourceVars.map((v, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>
                          • {v.name}
                        </div>
                      ))}
                      {preview.sourceCount > preview.sourceVars.length && (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          ... and {preview.sourceCount - preview.sourceVars.length} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Then (Action)</h3>
                <p style={styles.sectionHint}>
                  Alias matched variables to this target path
                </p>

                <div style={styles.field}>
                  <label style={styles.label}>Alias To *</label>
                  <PathBuilder
                    value={rule.then.aliasTo}
                    onChange={(val) => updateAction(val)}
                    graphData={graphData}
                    collections={collections}
                    targetCollectionNames={targetCollectionNames}
                  />
                  <div style={styles.hint}>
                    Format: collection/group or collection/group/variable
                  </div>
                </div>

                {/* Preview for target */}
                {preview && preview.targetCount > 0 && (
                  <div style={styles.previewBox}>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                      🎯 Target: {preview.targetCount} variable{preview.targetCount !== 1 ? 's' : ''} found
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', maxHeight: '100px', overflowY: 'auto' }}>
                      {preview.targetVars.map((v, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>
                          • {v.name}
                        </div>
                      ))}
                      {preview.targetCount > preview.targetVars.length && (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          ... and {preview.targetCount - preview.targetVars.length} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Variable pairing preview */}
                {preview && preview.matches.length > 0 && (
                  <div style={styles.previewBox}>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                      🔗 Variable Pairing Preview
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-color)', maxHeight: '150px', overflowY: 'auto' }}>
                      {preview.matches.slice(0, 10).map((match, i) => (
                        <div key={i} style={{ marginBottom: '6px', padding: '6px', backgroundColor: 'var(--secondary-bg)', borderRadius: '4px' }}>
                          <div style={{ fontWeight: 500 }}>
                            {match.sourceVariable.name} → {match.targetVariable.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {match.modeMappings.length} mode{match.modeMappings.length !== 1 ? 's' : ''} mapped
                          </div>
                        </div>
                      ))}
                      {preview.matches.length > 10 && (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px' }}>
                          ... and {preview.matches.length - 10} more pairings
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {preview?.error && (
                  <div style={styles.previewError}>
                    ⚠️ {preview.error}
                  </div>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={rule.enabled !== false}
                    onChange={(e) => updateRule({ enabled: e.target.checked })}
                  />
                  <span style={{ marginLeft: '8px' }}>Enabled</span>
                </label>
              </div>
            </div>
          ) : (
            // JSON View
            <div style={styles.jsonEditor}>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                style={styles.jsonTextarea}
                spellCheck={false}
              />
            </div>
          )}

          {errors.length > 0 && (
            <div style={styles.errors}>
              <strong>Errors:</strong>
              <ul style={styles.errorList}>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            style={styles.saveButton}
            onClick={showJSON ? handleJSONSave : handleSave}
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '8px',
    width: '700px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: '4px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
  },
  tab: {
    flex: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  activeTab: {
    color: '#0d99ff',
    borderBottom: '2px solid #0d99ff',
  },
  content: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  templateSection: {
    display: 'flex',
    justifyContent: 'center',
  },
  templateButton: {
    padding: '8px 16px',
    backgroundColor: 'var(--secondary-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-color)',
  },
  templates: {
    padding: '16px',
    backgroundColor: 'var(--secondary-bg)',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
  },
  templateCard: {
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '1px solid var(--border-color)',
    transition: 'all 0.2s',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'var(--secondary-bg)',
    borderRadius: '6px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
  },
  sectionHint: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-color)',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-color)',
  },
  textarea: {
    padding: '8px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-color)',
  },
  hint: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    cursor: 'pointer',
  },
  previewBox: {
    padding: '10px',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
    marginTop: '8px',
  },
  previewError: {
    padding: '10px',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
    border: '1px solid #ffc107',
    color: '#856404',
    fontSize: '12px',
    marginTop: '8px',
  },
  jsonEditor: {
    height: '100%',
  },
  jsonTextarea: {
    width: '100%',
    height: '400px',
    padding: '12px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'monospace',
    resize: 'none',
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-color)',
  },
  errors: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
    color: 'var(--error-color)',
    fontSize: '12px',
  },
  errorList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid var(--border-color)',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#0d99ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
};
