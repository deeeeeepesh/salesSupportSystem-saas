'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  /** @deprecated Use onSubmit instead. This prop is kept for backward compatibility but is no longer used. */
  onSearch?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onChange?: (value: string) => void;
  suggestions?: Array<{ type: 'brand' | 'model'; value: string }>;
}

export default function SearchBar({ 
  placeholder = "Search by brand, model, or variant...", 
  onSubmit, 
  onChange,
  suggestions = [] 
}: SearchBarProps) {
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Array<{ type: 'brand' | 'model'; value: string }>>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced onChange handler
  useEffect(() => {
    if (onChange && searchValue.length >= 1) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        onChange(searchValue);
      }, 300);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchValue, onChange]);

  // Filter suggestions based on search value
  useEffect(() => {
    if (searchValue.length >= 2) {
      const searchLower = searchValue.toLowerCase();
      const filtered = suggestions
        .filter(s => s.value.toLowerCase().includes(searchLower))
        .slice(0, 8); // Max 8 suggestions
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [searchValue, suggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (onSubmit) {
      onSubmit(searchValue);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchValue(suggestion);
    setShowSuggestions(false);
    if (onChange) {
      onChange(suggestion);
    }
    if (onSubmit) {
      onSubmit(suggestion);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    setShowSuggestions(false);
    if (onChange) {
      onChange('');
    }
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => {
            if (filteredSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow click on suggestions
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          className="pl-10 pr-10"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.value}-${index}`}
              className="px-4 py-2 hover:bg-accent cursor-pointer flex items-center gap-2"
              onClick={() => handleSuggestionClick(suggestion.value)}
            >
              <Search className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{suggestion.value}</span>
              <span className="ml-auto text-xs text-muted-foreground capitalize">
                {suggestion.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
