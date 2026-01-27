/**
 * Automate App - Brand Automation System
 * Main component with sidebar and Figma-style layout
 */

import React, { useEffect } from 'react';
import { BrandSidebar } from './components/brands/BrandSidebar';
import { BrandConfigPanel } from './components/BrandConfigPanel';
import { BrandVariableTable } from './components/BrandVariableTable';
import { CollectionsSidebar } from './components/variables/CollectionsSidebar';
import { GroupsSidebar } from './components/variables/GroupsSidebar';
import { VariablesErrorBoundary } from './components/variables/VariablesErrorBoundary';
import { useBrandStore } from '@/store/brand-store';

export function AutomateApp() {
  // Initialize Figma data on mount
  useEffect(() => {
    useBrandStore.getState().refreshFigmaData();
  }, []);
  
  return (
    <div className="h-screen w-screen flex bg-background relative">
      
      {/* Left: Brand Sidebar */}
      <BrandSidebar />
      
      {/* Middle: Figma-style Variables UI */}
      <div className="flex-1 bg-background overflow-hidden flex">
        {/* Collections Sidebar */}
        <VariablesErrorBoundary>
          <CollectionsSidebar />
        </VariablesErrorBoundary>
        
        {/* Groups Sidebar */}
        <VariablesErrorBoundary>
          <GroupsSidebar />
        </VariablesErrorBoundary>
        
        {/* Variable Table - Takes remaining space */}
        <VariablesErrorBoundary>
          <div className="flex-1 overflow-hidden">
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
