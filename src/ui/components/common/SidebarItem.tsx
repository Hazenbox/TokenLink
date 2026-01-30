import React from 'react';
import { cn } from '@colors/utils';

interface SidebarItemProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SidebarItem({ 
  isActive, 
  onClick, 
  children, 
  className 
}: SidebarItemProps) {
  return (
    <div
      className={cn(
        "group flex h-7 items-center justify-between rounded-lg pl-3 pr-1 text-xs transition-colors cursor-pointer select-none",
        isActive
          ? "bg-surface-elevated"
          : "hover:bg-surface",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
