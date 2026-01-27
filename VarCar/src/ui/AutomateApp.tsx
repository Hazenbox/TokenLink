/**
 * Automate App - Brand Automation System
 * Main component with sidebar and 2-column layout
 */

import React from 'react';
import { BrandSidebar } from './components/brands/BrandSidebar';
import { BrandConfigPanel } from './components/BrandConfigPanel';
import { BrandVariableTable } from './components/BrandVariableTable';

export function AutomateApp() {
  return (
    <div className="h-screen w-screen flex bg-background relative">
      
      {/* Left: Brand Sidebar - 192px like ColorSidebar */}
      <BrandSidebar />
      
      {/* Middle: Configuration - Fixed width */}
      <div className="w-[280px] border-r border-border/50 bg-card shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)] overflow-hidden">
        <BrandConfigPanel />
      </div>
      
      {/* Right: Variable Table - Takes remaining space */}
      <div className="flex-1 bg-card overflow-hidden">
        <BrandVariableTable />
      </div>
    </div>
  );
}
