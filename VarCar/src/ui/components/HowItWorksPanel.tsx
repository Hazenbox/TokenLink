/**
 * How It Works Panel
 * Detailed documentation about the automation and mapping system
 */

import React from 'react';
import { X, Layers, Link2, Zap, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HowItWorksPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksPanel({ isOpen, onClose }: HowItWorksPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-surface-elevated border border-border rounded-lg shadow-2xl w-[90vw] max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">How the Automation Works</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-interactive-hover text-foreground-tertiary hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-8">
            {/* Overview */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Overview
              </h3>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                The automation system generates a comprehensive multi-layer architecture that creates 
                2,600+ Figma variables across 9 collections. This automated approach ensures consistency, 
                maintainability, and dynamic theme switching capabilities.
              </p>
            </section>

            {/* Multi-Layer Architecture */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Multi-Layer Architecture
              </h3>
              <div className="space-y-3">
                <LayerCard
                  layer="Layer 0"
                  title="Primitives"
                  description="Base RGB color values sourced from RangDe. These are the foundation colors that don't change."
                  example="rgb.primary.500 = #3B82F6"
                />
                <LayerCard
                  layer="Layer 1"
                  title="Semi-Semantics"
                  description="Grey scale calculations and color variations derived from primitives."
                  example="scale.grey.600 = calculated from base"
                />
                <LayerCard
                  layer="Layer 2"
                  title="Color Modes"
                  description="Light and Dark mode color assignments. Variables switch based on active mode."
                  example="mode.light.surface = #FFFFFF"
                />
                <LayerCard
                  layer="Layer 3-8"
                  title="Hierarchy & States"
                  description="Component-level variables, interaction states, themes, and contextual variations."
                  example="button.primary.default.background"
                />
              </div>
            </section>

            {/* Variable Alias Chains */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Variable Alias Chains
              </h3>
              <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
                Variables use VARIABLE_ALIAS references to create dynamic chains. When a base color changes, 
                all dependent variables update automatically through the alias chain.
              </p>
              <div className="bg-background rounded-lg p-4 border border-border/40">
                <div className="font-mono text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground-tertiary">Layer 0:</span>
                    <span className="text-foreground">rgb.primary.600</span>
                    <ChevronRight className="w-3 h-3 text-foreground-tertiary" />
                    <span className="text-blue-400">#3B82F6</span>
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-foreground-tertiary">Layer 2:</span>
                    <span className="text-foreground">mode.light.accent</span>
                    <ChevronRight className="w-3 h-3 text-foreground-tertiary" />
                    <span className="text-green-400">→ rgb.primary.600</span>
                  </div>
                  <div className="flex items-center gap-2 pl-8">
                    <span className="text-foreground-tertiary">Layer 5:</span>
                    <span className="text-foreground">button.primary.bg</span>
                    <ChevronRight className="w-3 h-3 text-foreground-tertiary" />
                    <span className="text-green-400">→ mode.light.accent</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Palette Mapping */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3">Palette Mapping</h3>
              <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
                Each brand configuration maps semantic roles to specific palettes:
              </p>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-foreground-tertiary mt-1">•</span>
                  <span><strong className="text-foreground">Primary:</strong> Main brand color used for primary actions and emphasis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground-tertiary mt-1">•</span>
                  <span><strong className="text-foreground">Secondary:</strong> Supporting color for secondary actions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground-tertiary mt-1">•</span>
                  <span><strong className="text-foreground">Sparkle:</strong> Accent highlights and special elements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground-tertiary mt-1">•</span>
                  <span><strong className="text-foreground">Neutral:</strong> Greys for surfaces, borders, and text</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground-tertiary mt-1">•</span>
                  <span><strong className="text-foreground">Semantic:</strong> Positive, Negative, Warning, Informative states</span>
                </li>
              </ul>
            </section>

            {/* Sync Process */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3">Sync Process</h3>
              <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
                When you click "Sync Brand", the system:
              </p>
              <ol className="space-y-3">
                <StepCard
                  number={1}
                  title="Validates Configuration"
                  description="Checks that all required palettes are assigned and valid"
                />
                <StepCard
                  number={2}
                  title="Generates Variables"
                  description="Creates all 2,600+ variables with proper hierarchy and aliases"
                />
                <StepCard
                  number={3}
                  title="Creates Collections"
                  description="Organizes variables into 9 collections (Primitives, Modes, Components, etc.)"
                />
                <StepCard
                  number={4}
                  title="Applies to Figma"
                  description="Syncs all variables to your Figma file with proper naming and structure"
                />
              </ol>
            </section>

            {/* Benefits */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3">Key Benefits</h3>
              <div className="grid grid-cols-2 gap-3">
                <BenefitCard
                  title="Consistency"
                  description="Unified color system across all designs"
                />
                <BenefitCard
                  title="Scalability"
                  description="Easily add new themes and variations"
                />
                <BenefitCard
                  title="Maintainability"
                  description="Update once, propagate everywhere"
                />
                <BenefitCard
                  title="Dynamic Theming"
                  description="Light/dark modes switch automatically"
                />
              </div>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Helper components
function LayerCard({ layer, title, description, example }: { 
  layer: string; 
  title: string; 
  description: string; 
  example: string; 
}) {
  return (
    <div className="bg-background rounded-lg p-4 border border-border/40">
      <div className="flex items-start gap-3">
        <span className="text-xs font-semibold text-foreground-tertiary bg-surface-elevated px-2 py-1 rounded">
          {layer}
        </span>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground mb-1">{title}</h4>
          <p className="text-xs text-foreground-secondary leading-relaxed mb-2">{description}</p>
          <code className="text-[10px] text-foreground-tertiary bg-surface-elevated px-2 py-1 rounded">
            {example}
          </code>
        </div>
      </div>
    </div>
  );
}

function StepCard({ number, title, description }: { 
  number: number; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-surface-elevated text-foreground text-xs font-semibold flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <div>
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-xs text-foreground-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function BenefitCard({ title, description }: { 
  title: string; 
  description: string; 
}) {
  return (
    <div className="bg-background rounded-lg p-3 border border-border/40">
      <h4 className="text-sm font-medium text-foreground mb-1">{title}</h4>
      <p className="text-xs text-foreground-secondary leading-relaxed">{description}</p>
    </div>
  );
}
