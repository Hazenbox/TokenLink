/**
 * Automate App - Brand Automation System
 * Main component with sidebar and Figma-style layout
 */

import React, { useEffect } from 'react';
import { BrandSidebar } from './components/brands/BrandSidebar';
import { BrandConfigPanel } from './components/BrandConfigPanel';
import { BrandVariableTable } from './components/BrandVariableTable';
import { CollectionsGroupsPanel } from './components/variables/CollectionsGroupsPanel';
import { VariablesErrorBoundary } from './components/variables/VariablesErrorBoundary';
import { useBrandStore } from '@/store/brand-store';

export function AutomateApp() {
  // Initialize brands and Figma data on mount
  useEffect(() => {
    const store = useBrandStore.getState();
    store.loadBrands(); // Load from Figma clientStorage with localStorage fallback
    store.refreshFigmaData(); // Refresh Figma UI data
  }, []);
  
  return (
    <div className="h-full w-full flex bg-background relative overflow-hidden min-w-0">
      
      {/* Left: Brand Sidebar */}
      <BrandSidebar />
      
      {/* Middle: Figma-style Variables UI */}
      <div className="flex-1 bg-background overflow-hidden flex max-w-full min-w-0">
        {/* Collections & Groups Combined Panel */}
        <VariablesErrorBoundary>
          <CollectionsGroupsPanel />
        </VariablesErrorBoundary>
        
        {/* Variable Table - Takes remaining space */}
        <VariablesErrorBoundary>
          <div className="flex-1 overflow-hidden min-w-0">
            <BrandVariableTable />
          </div>
        </VariablesErrorBoundary>
      </div>
      
      {/* Right: Configuration Panel - Collapsible */}
      <VariablesErrorBoundary>
        <BrandConfigPanel />
      </VariablesErrorBoundary>
    </div>
  );
}
