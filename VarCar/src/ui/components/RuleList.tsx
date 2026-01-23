/**
 * RuleList component - displays and manages rules
 */

import React from 'react';
import { Rule } from '../../models/rules';

interface RuleListProps {
  rules: Rule[];
  onAddRule: () => void;
  onEditRule: (rule: Rule) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string) => void;
}

export function RuleList({
  rules,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleRule,
}: RuleListProps) {
  if (rules.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No rules defined yet.</p>
        <button style={styles.addButton} onClick={onAddRule}>
          + Add First Rule
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Rules ({rules.length})</h3>
        <button style={styles.addButton} onClick={onAddRule}>
          + Add Rule
        </button>
      </div>

      <div style={styles.ruleList}>
        {rules.map((rule) => (
          <RuleItem
            key={rule.id}
            rule={rule}
            onEdit={() => onEditRule(rule)}
            onDelete={() => onDeleteRule(rule.id)}
            onToggle={() => onToggleRule(rule.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface RuleItemProps {
  rule: Rule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function RuleItem({ rule, onEdit, onDelete, onToggle }: RuleItemProps) {
  const enabled = rule.enabled !== false;

  return (
    <div style={{
      ...styles.ruleItem,
      opacity: enabled ? 1 : 0.5,
    }}>
      <div style={styles.ruleHeader}>
        <div style={styles.ruleHeaderLeft}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={onToggle}
            style={styles.checkbox}
          />
          <div style={styles.ruleInfo}>
            <div style={styles.ruleName}>{rule.name}</div>
            {rule.description && (
              <div style={styles.ruleDescription}>{rule.description}</div>
            )}
          </div>
        </div>
        <div style={styles.ruleActions}>
          <button
            style={styles.editButton}
            onClick={onEdit}
            title="Edit rule"
          >
            Edit
          </button>
          <button
            style={styles.deleteButton}
            onClick={onDelete}
            title="Delete rule"
          >
            Delete
          </button>
        </div>
      </div>

      <div style={styles.ruleDetails}>
        <div style={styles.ruleCondition}>
          <strong>When:</strong>
          {rule.when.collection && (
            <span style={styles.conditionTag}>
              Collection: {rule.when.collection}
            </span>
          )}
          {rule.when.group && (
            <span style={styles.conditionTag}>
              Group: {rule.when.group}
            </span>
          )}
        </div>
        <div style={styles.ruleAction}>
          <strong>Then:</strong>
          <span style={styles.actionTag}>
            Alias to: {rule.then.aliasTo}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#0d99ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    gap: '16px',
  },
  emptyText: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    margin: 0,
  },
  ruleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    flex: 1,
  },
  ruleItem: {
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '12px',
    backgroundColor: 'var(--card-bg)',
  },
  ruleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  ruleHeaderLeft: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    flex: 1,
  },
  checkbox: {
    marginTop: '2px',
    cursor: 'pointer',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  ruleDescription: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  ruleActions: {
    display: 'flex',
    gap: '4px',
  },
  editButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  deleteButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  ruleDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '12px',
  },
  ruleCondition: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ruleAction: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  conditionTag: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
  },
  actionTag: {
    backgroundColor: '#e8f5e9',
    color: '#388e3c',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
  },
};
