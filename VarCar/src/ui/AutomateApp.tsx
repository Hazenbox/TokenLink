/**
 * Automate App - Brand Automation System
 * Main component with 30/70 hybrid layout
 */

import React, { useState } from 'react';
import { BrandListPanel } from './components/BrandListPanel';
import { BrandConfigPanel } from './components/BrandConfigPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { SyncPanel } from './components/SyncPanel';
import { BrandStatsPanel } from './components/BrandStatsPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function AutomateApp() {
  const [rightPanelView, setRightPanelView] = useState<'stats' | 'graph'>('stats');

  return (
    <div className="h-screen w-screen flex bg-background">
      {/* Left Column - 30% */}
      <div className="w-[30%] flex flex-col border-r border-border bg-surface">
        {/* Brand List - Top 35% */}
        <div className="h-[35%] border-b border-border">
          <BrandListPanel />
        </div>

        {/* Brand Config - Middle 40% */}
        <div className="h-[40%] border-b border-border overflow-hidden">
          <BrandConfigPanel />
        </div>

        {/* Validation - Bottom 15% */}
        <div className="h-[10%] border-b border-border overflow-hidden">
          <ValidationPanel />
        </div>

        {/* Sync Panel - Bottom 15% */}
        <div className="h-[15%] overflow-hidden">
          <SyncPanel />
        </div>
      </div>

      {/* Right Column - 70% */}
      <div className="w-[70%] flex flex-col bg-card">
        {/* Tabs for different views */}
        <Tabs
          value={rightPanelView}
          onValueChange={(v) => setRightPanelView(v as 'stats' | 'graph')}
          className="h-full flex flex-col"
        >
          <div className="border-b border-border px-6 pt-4">
            <TabsList>
              <TabsTrigger value="stats">Statistics & Overview</TabsTrigger>
              <TabsTrigger value="graph">Variable Graph (Coming Soon)</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="stats" className="flex-1 overflow-hidden m-0">
            <BrandStatsPanel />
          </TabsContent>

          <TabsContent value="graph" className="flex-1 overflow-hidden m-0">
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-2xl">
                <div className="text-6xl mb-4">🚧</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Variable Graph Visualization
                </h2>
                <p className="text-foreground-secondary mb-4">
                  Interactive graph visualization showing alias chains, collection trees,
                  and mode branching is coming soon.
                </p>
                <div className="text-sm text-foreground-tertiary space-y-2">
                  <p>• 7-9 level variable chain visualization</p>
                  <p>• Collection tree with hierarchy</p>
                  <p>• Mode branching display</p>
                  <p>• Interactive node editing</p>
                  <p>• Zoom, pan, and search capabilities</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
