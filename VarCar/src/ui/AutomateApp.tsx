/**
 * Automate App - Brand Automation System
 * Main component with 3-column layout
 */

import React from 'react';
import { BrandListPanel } from './components/BrandListPanel';
import { BrandConfigPanel } from './components/BrandConfigPanel';
import { BrandVariableTable } from './components/BrandVariableTable';

export function AutomateApp() {
  return (
    <div className="h-screen w-screen flex bg-background">
      {/* Left: Brand List - Fixed width */}
      <div className="w-[250px] border-r border-border bg-surface flex-shrink-0">
        <BrandListPanel />
      </div>
      
      {/* Middle: Configuration - Flexible */}
      <div className="flex-1 min-w-[400px] border-r border-border bg-card">
        <BrandConfigPanel />
      </div>
      
      {/* Right: Variable Table - Flexible */}
      <div className="flex-1 min-w-[500px] bg-card">
        <BrandVariableTable />
      </div>
    </div>
  );
}
