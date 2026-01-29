import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search",
  className = ""
}: SearchInputProps) {
  return (
    <div className="px-2 py-2">
      <div className="relative group">
        <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground-tertiary" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-7 px-2 pl-7 pr-7 text-xs bg-background border-border/40 ${className}`}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-interactive-hover rounded-full transition-colors cursor-pointer"
          >
            <X className="h-3 w-3 text-foreground-tertiary" />
          </button>
        )}
      </div>
    </div>
  );
}
