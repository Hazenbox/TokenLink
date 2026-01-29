/**
 * Guide Page - Comprehensive Documentation
 * Full-page view explaining the Token Link automation system
 */

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Layers, Link2, Zap, Package } from 'lucide-react';

export function GuidePage() {
  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/30 flex-shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Token Link Guide</h1>
        <p className="text-sm text-foreground-secondary mt-1">
          Complete documentation on how Token Link automates your design system
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="mapping">Variable Mapping</TabsTrigger>
              <TabsTrigger value="layers">Layer System</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8 mt-6">
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  What is Token Link?
                </h2>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  Token Link is a Figma plugin that automates the creation and management of design tokens 
                  (variables) across your design system. It generates 2,600+ variables organized in 9 
                  collections, with full support for light/dark modes and multi-brand theming.
                </p>
              </section>

              <section>
                <h3 className="text-base font-semibold text-foreground mb-3">System Architecture</h3>
                <div className="bg-surface-elevated border border-border rounded-lg p-6">
                  <div className="space-y-4">
                    {/* Architecture Diagram (Text-based) */}
                    <div className="font-mono text-xs space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-32 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400">
                          Brand
                        </div>
                        <ArrowRight className="w-4 h-4 text-foreground-tertiary" />
                        <div className="w-32 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400">
                          9 Collections
                        </div>
                      </div>
                      
                      <div className="ml-48 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-32 px-3 py-2 bg-surface border border-border rounded text-foreground-secondary text-[10px]">
                            Layer 0: Primitives
                          </div>
                          <span className="text-foreground-tertiary text-[10px]">Raw RGB values</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 px-3 py-2 bg-surface border border-border rounded text-foreground-secondary text-[10px]">
                            Layer 1: Scales
                          </div>
                          <span className="text-foreground-tertiary text-[10px]">Color calculations</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 px-3 py-2 bg-surface border border-border rounded text-foreground-secondary text-[10px]">
                            Layer 2: Modes
                          </div>
                          <span className="text-foreground-tertiary text-[10px]">Light/Dark themes</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 px-3 py-2 bg-surface border border-border rounded text-foreground-secondary text-[10px]">
                            Layer 3-8: Components
                          </div>
                          <span className="text-foreground-tertiary text-[10px]">UI elements</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-base font-semibold text-foreground mb-3">Key Benefits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <BenefitCard
                    title="Consistency"
                    description="All colors derived from a single source of truth"
                  />
                  <BenefitCard
                    title="Scalability"
                    description="Support unlimited brands without manual work"
                  />
                  <BenefitCard
                    title="Maintainability"
                    description="Update one color, cascade changes everywhere"
                  />
                  <BenefitCard
                    title="Dynamic Theming"
                    description="Instant light/dark mode switching built-in"
                  />
                </div>
              </section>
            </TabsContent>

            {/* Variable Mapping Tab */}
            <TabsContent value="mapping" className="space-y-8 mt-6">
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Variable Mapping Logic
                </h2>
                <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
                  Each variable references (aliases) another variable, creating a dynamic chain. 
                  When you change a base color, all dependent variables update automatically.
                </p>

                {/* Mapping Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-elevated border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-secondary">Layer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-secondary">Collection</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-secondary">Variable Pattern</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-secondary">Example</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-secondary">Aliases From</th>
                      </tr>
                    </thead>
                    <tbody>
                      <MappingRow
                        layer="0"
                        collection="Primitives"
                        pattern="rgb.{role}.{step}"
                        example="rgb.primary.600"
                        aliases="None (raw values)"
                        layerColor="blue"
                      />
                      <MappingRow
                        layer="1"
                        collection="Semi-Semantics"
                        pattern="scale.{type}.{step}"
                        example="scale.surface.100"
                        aliases="Layer 0 primitives"
                        layerColor="purple"
                      />
                      <MappingRow
                        layer="2"
                        collection="Modes"
                        pattern="mode.{mode}.{semantic}"
                        example="mode.light.surface"
                        aliases="Layer 1 scales"
                        layerColor="green"
                      />
                      <MappingRow
                        layer="3"
                        collection="Surface"
                        pattern="surface.{level}"
                        example="surface.elevated"
                        aliases="Layer 2 modes"
                        layerColor="orange"
                      />
                      <MappingRow
                        layer="4-8"
                        collection="Components"
                        pattern="{component}.{variant}.{state}"
                        example="button.primary.hover"
                        aliases="Layer 3 surfaces"
                        layerColor="red"
                      />
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mt-8">
                <h3 className="text-base font-semibold text-foreground mb-4">Alias Chain Example</h3>
                <div className="bg-surface-elevated border border-border rounded-lg p-6">
                  <div className="font-mono text-xs space-y-3">
                    <ChainStep
                      layer="Layer 0"
                      variable="rgb.primary.600"
                      value="#3B82F6"
                      description="Base RGB value from palette"
                    />
                    <ArrowDown />
                    <ChainStep
                      layer="Layer 1"
                      variable="scale.surface.600"
                      value="→ rgb.primary.600"
                      description="References primitive"
                    />
                    <ArrowDown />
                    <ChainStep
                      layer="Layer 2"
                      variable="mode.light.primary"
                      value="→ scale.surface.600"
                      description="Light mode assignment"
                    />
                    <ArrowDown />
                    <ChainStep
                      layer="Layer 3"
                      variable="surface.primary"
                      value="→ mode.light.primary"
                      description="Surface semantic"
                    />
                    <ArrowDown />
                    <ChainStep
                      layer="Layer 4"
                      variable="button.primary.background"
                      value="→ surface.primary"
                      description="Component-specific"
                    />
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* Layer System Tab */}
            <TabsContent value="layers" className="space-y-8 mt-6">
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  9-Layer Architecture
                </h2>
                <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
                  Token Link organizes variables into 9 distinct layers, each building upon the previous one.
                  This hierarchical structure ensures consistency and makes changes propagate correctly.
                </p>

                <div className="space-y-4">
                  <LayerCard
                    layer="Layer 0"
                    title="Primitives (RGB)"
                    description="Foundation colors from your brand palette. These are raw hex/RGB values that never change."
                    variables={["rgb.primary.50 → rgb.primary.900", "rgb.secondary.*", "rgb.neutral.*"]}
                    count="~192 variables"
                  />
                  <LayerCard
                    layer="Layer 1"
                    title="Semi-Semantics (Scales)"
                    description="Calculated color scales including surface scales, high/medium/low contrast variants."
                    variables={["scale.surface.*", "scale.high.*", "scale.bold.*"]}
                    count="~600 variables"
                  />
                  <LayerCard
                    layer="Layer 2"
                    title="Modes (Light/Dark)"
                    description="Mode-specific color assignments. Variables switch values based on active mode."
                    variables={["mode.light.surface", "mode.dark.surface", "mode.light.text"]}
                    count="~200 variables"
                  />
                  <LayerCard
                    layer="Layer 3"
                    title="Surface Tokens"
                    description="Semantic surface colors for backgrounds, cards, and containers."
                    variables={["surface.base", "surface.elevated", "surface.overlay"]}
                    count="~100 variables"
                  />
                  <LayerCard
                    layer="Layer 4-8"
                    title="Component Tokens"
                    description="Component-specific variables for buttons, inputs, navigation, feedback, etc."
                    variables={["button.primary.*", "input.default.*", "badge.success.*"]}
                    count="~1500+ variables"
                  />
                </div>
              </section>
            </TabsContent>

            {/* Workflow Tab */}
            <TabsContent value="workflow" className="space-y-8 mt-6">
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  How to Use Token Link
                </h2>

                <div className="space-y-6">
                  <WorkflowStep
                    number={1}
                    title="Create Color Palettes"
                    description="Use the Colors tab to generate accessible color scales with WCAG-compliant contrast ratios."
                  />
                  <WorkflowStep
                    number={2}
                    title="Create a Brand"
                    description="In the Automate tab, create a new brand and assign your color palettes to semantic roles (Primary, Secondary, Neutral, etc.)."
                  />
                  <WorkflowStep
                    number={3}
                    title="Preview & Validate"
                    description="Token Link validates your configuration and shows exactly what will be generated."
                  />
                  <WorkflowStep
                    number={4}
                    title="Sync to Figma"
                    description="Click 'Sync to Figma' to generate all 2,600+ variables in your Figma file. Changes take ~5 seconds."
                  />
                  <WorkflowStep
                    number={5}
                    title="Use in Designs"
                    description="Apply variables to your designs. Switch between brands or light/dark modes instantly."
                  />
                </div>
              </section>

              <section className="mt-8">
                <h3 className="text-base font-semibold text-foreground mb-4">Tips & Best Practices</h3>
                <div className="bg-surface-elevated border border-border rounded-lg p-6">
                  <ul className="space-y-3 text-sm text-foreground-secondary">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Always validate your brand before syncing to catch potential issues early</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Export your brands regularly as JSON backups to prevent data loss</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Use the Graph view to visualize variable relationships and understand alias chains</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Test your color palettes in both light and dark modes before finalizing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">!</span>
                      <span>Sync operations are rate-limited to 5 per minute to prevent overwhelming Figma</span>
                    </li>
                  </ul>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

// Helper Components

function BenefitCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-surface-elevated border border-border rounded-lg p-4">
      <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-xs text-foreground-secondary">{description}</p>
    </div>
  );
}

function MappingRow({ 
  layer, 
  collection, 
  pattern, 
  example, 
  aliases,
  layerColor 
}: { 
  layer: string; 
  collection: string; 
  pattern: string; 
  example: string; 
  aliases: string;
  layerColor: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    orange: 'bg-orange-500/10 text-orange-400',
    red: 'bg-red-500/10 text-red-400'
  };

  return (
    <tr className="border-b border-border/50 hover:bg-surface-elevated/50 transition-colors">
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs font-mono ${colorClasses[layerColor]}`}>
          {layer}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-foreground">{collection}</td>
      <td className="px-4 py-3 text-xs font-mono text-foreground-secondary">{pattern}</td>
      <td className="px-4 py-3 text-xs font-mono text-blue-400">{example}</td>
      <td className="px-4 py-3 text-xs text-foreground-tertiary">{aliases}</td>
    </tr>
  );
}

function ChainStep({ layer, variable, value, description }: { layer: string; variable: string; value: string; description: string }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-background rounded border border-border">
      <div className="flex-shrink-0 w-20 text-foreground-tertiary text-[10px]">{layer}</div>
      <div className="flex-1">
        <div className="text-foreground">{variable}</div>
        <div className="text-blue-400 text-[10px]">{value}</div>
      </div>
      <div className="flex-1 text-foreground-tertiary text-[10px]">{description}</div>
    </div>
  );
}

function ArrowDown() {
  return (
    <div className="flex justify-center">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-foreground-tertiary">
        <path d="M8 2V14M8 14L12 10M8 14L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function LayerCard({ 
  layer, 
  title, 
  description, 
  variables, 
  count 
}: { 
  layer: string; 
  title: string; 
  description: string; 
  variables: string[]; 
  count: string;
}) {
  return (
    <div className="bg-surface-elevated border border-border rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
              {layer}
            </span>
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          </div>
          <p className="text-xs text-foreground-secondary mt-2">{description}</p>
        </div>
        <span className="text-xs text-foreground-tertiary flex-shrink-0 ml-4">{count}</span>
      </div>
      <div className="mt-3 pt-3 border-t border-border/30">
        <p className="text-xs text-foreground-tertiary mb-2">Example variables:</p>
        <div className="space-y-1">
          {variables.map((v, i) => (
            <code key={i} className="block text-xs font-mono text-foreground-secondary">• {v}</code>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkflowStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
        <span className="text-sm font-semibold text-blue-400">{number}</span>
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-xs text-foreground-secondary">{description}</p>
      </div>
    </div>
  );
}
