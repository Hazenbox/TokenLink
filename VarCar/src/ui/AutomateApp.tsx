/**
 * Automate App - Brand Automation System
 * Main component with 3-column layout
 */

import React from 'react';
import { BrandListPanel } from './components/BrandListPanel';
import { BrandConfigPanel } from './components/BrandConfigPanel';
import { BrandVariableTable } from './components/BrandVariableTable';
import { CanvasBackground } from './layout/CanvasBackground';

export function AutomateApp() {
  return (
    <div className="h-screen w-screen flex bg-background-canvas relative">
      <CanvasBackground />
      
      {/* Left: Brand List - Fixed width */}
      <div className="w-[250px] border-r border-border/50 bg-surface flex-shrink-0 shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]">
        <BrandListPanel />
      </div>
      
      {/* Middle: Configuration - Fixed width (reduced by 50%) */}
      <div className="w-[400px] border-r border-border/50 bg-card shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]">
        <BrandConfigPanel />
      </div>
      
      {/* Right: Variable Table - Takes remaining space */}
      <div className="flex-1 bg-card">
        <BrandVariableTable />
      </div>
    </div>
  );
}
