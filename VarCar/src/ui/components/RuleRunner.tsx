/**
 * RuleRunner component - runs rules in dry-run or apply mode
 */

import React, { useState } from 'react';
import { Rule } from '../../models/rules';

interface EvaluationSummary {
  mode: string;
  totalRules: number;
  totalMatched: number;
  totalAliases: number;
  success: boolean;
}

interface EvaluationStep {
  ruleId: string;
  ruleName: string;
  status: 'matched' | 'skipped' | 'error';
  matchCount: number;
  aliasCount: number;
  details: string[];
  warnings: string[];
  error?: string;
}

interface FormattedResult {
  summary: EvaluationSummary;
  steps: EvaluationStep[];
  errors: string[];
  warnings: string[];
}

interface RuleRunnerProps {
  rules: Rule[];
  onDryRun: (rulesJSON: string) => void;
  onApply: (rulesJSON: string) => void;
}

export function RuleRunner({ rules, onDryRun, onApply }: RuleRunnerProps) {
  const [result, setResult] = useState<FormattedResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const handleDryRun = () => {
    if (rules.length === 0) {
      alert('No rules to evaluate. Please add some rules first.');
      return;
    }

    const rulesJSON = JSON.stringify(rules);
    setIsRunning(true);
    setResult(null);
    onDryRun(rulesJSON);
  };

  const handleApply = () => {
    if (rules.length === 0) {
      alert('No rules to apply. Please add some rules first.');
      return;
    }

    const confirmation = confirm(
      `Are you sure you want to apply ${rules.filter(r => r.enabled !== false).length} rule(s)?\n\n` +
      `This will create aliases in your Figma file. You can undo this action in Figma.`
    );

    if (!confirmation) return;

    const rulesJSON = JSON.stringify(rules);
    setIsRunning(true);
    setResult(null);
    onApply(rulesJSON);
  };

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const expandAll = () => {
    if (result) {
      setExpandedSteps(new Set(result.steps.map(s => s.ruleId)));
    }
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  // This would be called from parent when results arrive
  React.useEffect(() => {
    // Parent component would call setResult when results are received
    // For now, this is just a placeholder
  }, []);

  const enabledCount = rules.filter(r => r.enabled !== false).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <h3 style={styles.title}>Rule Evaluation</h3>
          <div style={styles.stats}>
            <span style={styles.stat}>
              Total Rules: <strong>{rules.length}</strong>
            </span>
            <span style={styles.stat}>
              Enabled: <strong>{enabledCount}</strong>
            </span>
          </div>
        </div>

        <div style={styles.actions}>
          <button
            style={styles.dryRunButton}
            onClick={handleDryRun}
            disabled={isRunning || rules.length === 0}
          >
            Dry Run (Preview)
          </button>
          <button
            style={styles.applyButton}
            onClick={handleApply}
            disabled={isRunning || rules.length === 0}
          >
            Apply Rules
          </button>
        </div>
      </div>

      {isRunning && !result && (
        <div style={styles.loading}>
          <p>Evaluating rules...</p>
        </div>
      )}

      {result && (
        <div style={styles.results}>
          <div style={styles.summary}>
            <div style={styles.summaryHeader}>
              <h4 style={styles.summaryTitle}>
                {result.summary.mode === 'dry-run' ? 'Dry Run Results' : 'Apply Results'}
              </h4>
              <div style={styles.summaryActions}>
                <button style={styles.expandButton} onClick={expandAll}>
                  Expand All
                </button>
                <button style={styles.expandButton} onClick={collapseAll}>
                  Collapse All
                </button>
              </div>
            </div>

            <div style={styles.summaryStats}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Status:</span>
                <span style={{
                  ...styles.summaryValue,
                  color: result.summary.success ? 'var(--success-color)' : 'var(--error-color)',
                  fontWeight: 600,
                }}>
                  {result.summary.success ? 'Success' : 'Failed'}
                </span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Variables Matched:</span>
                <span style={styles.summaryValue}>{result.summary.totalMatched}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Aliases to Create:</span>
                <span style={styles.summaryValue}>{result.summary.totalAliases}</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div style={styles.errorBox}>
                <strong>Errors:</strong>
                <ul style={styles.messageList}>
                  {result.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div style={styles.warningBox}>
                <strong>Warnings:</strong>
                <ul style={styles.messageList}>
                  {result.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={styles.steps}>
            <h4 style={styles.stepsTitle}>Step-by-Step Evaluation</h4>
            {result.steps.map((step, index) => (
              <StepItem
                key={step.ruleId}
                step={step}
                index={index}
                isExpanded={expandedSteps.has(step.ruleId)}
                onToggle={() => toggleStep(step.ruleId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StepItemProps {
  step: EvaluationStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function StepItem({ step, index, isExpanded, onToggle }: StepItemProps) {
  const getStatusColor = () => {
    switch (step.status) {
      case 'matched':
        return 'var(--success-color)';
      case 'skipped':
        return 'var(--warning-color)';
      case 'error':
        return 'var(--error-color)';
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case 'matched':
        return '●';
      case 'skipped':
        return '○';
      case 'error':
        return '×';
    }
  };

  return (
    <div style={styles.stepItem}>
      <div style={styles.stepHeader} onClick={onToggle}>
        <div style={styles.stepHeaderLeft}>
          <span style={styles.stepNumber}>{index + 1}</span>
          <span style={styles.stepName}>{step.ruleName}</span>
          <span style={{
            ...styles.stepStatus,
            color: getStatusColor(),
          }}>
            {getStatusIcon()} {step.status}
          </span>
        </div>
        <div style={styles.stepHeaderRight}>
          {step.status === 'matched' && (
            <span style={styles.stepCount}>
              {step.matchCount} match{step.matchCount !== 1 ? 'es' : ''}, {step.aliasCount} alias{step.aliasCount !== 1 ? 'es' : ''}
            </span>
          )}
          <span style={styles.expandIcon}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div style={styles.stepContent}>
          {step.status === 'matched' && step.details.length > 0 && (
            <div style={styles.stepDetails}>
              <strong>Matches:</strong>
              <ul style={styles.detailsList}>
                {step.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          {step.error && (
            <div style={styles.stepError}>
              <strong>Error:</strong> {step.error}
            </div>
          )}

          {step.warnings.length > 0 && (
            <div style={styles.stepWarnings}>
              <strong>Warnings:</strong>
              <ul style={styles.detailsList}>
                {step.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Expose setResult for parent component
export function useRuleRunnerState() {
  const [result, setResult] = useState<FormattedResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  return { result, setResult, isRunning, setIsRunning };
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    height: '100%',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  headerInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
  },
  stats: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  stat: {},
  actions: {
    display: 'flex',
    gap: '12px',
  },
  dryRunButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#0d99ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  applyButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#388e3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: 'var(--text-secondary)',
  },
  results: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    flex: 1,
  },
  summary: {
    backgroundColor: 'var(--secondary-bg)',
    padding: '16px',
    borderRadius: '6px',
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  summaryTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
  },
  summaryActions: {
    display: 'flex',
    gap: '8px',
  },
  expandButton: {
    padding: '4px 8px',
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  summaryStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  summaryLabel: {
    color: 'var(--text-secondary)',
  },
  summaryValue: {
    fontWeight: 500,
  },
  errorBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'var(--error-color)',
  },
  warningBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#fff3e0',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'var(--warning-color)',
  },
  messageList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  stepsTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 600,
  },
  stepItem: {
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  stepHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: 'var(--card-bg)',
    cursor: 'pointer',
    userSelect: 'none',
  },
  stepHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  stepNumber: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    lineHeight: '24px',
    textAlign: 'center',
    backgroundColor: 'var(--secondary-bg)',
    borderRadius: '50%',
    fontSize: '12px',
    fontWeight: 600,
  },
  stepName: {
    fontSize: '14px',
    fontWeight: 500,
  },
  stepStatus: {
    fontSize: '12px',
    fontWeight: 500,
  },
  stepHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stepCount: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  expandIcon: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  stepContent: {
    padding: '12px',
    backgroundColor: 'var(--secondary-bg)',
    borderTop: '1px solid var(--border-color)',
    fontSize: '12px',
  },
  stepDetails: {
    marginBottom: '8px',
  },
  detailsList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
  },
  stepError: {
    color: 'var(--error-color)',
    marginBottom: '8px',
  },
  stepWarnings: {
    color: 'var(--warning-color)',
  },
};
