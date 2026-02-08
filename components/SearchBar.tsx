'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  /** @deprecated Use onSubmit instead. This prop is kept for backward compatibility but is no longer used. */
  onSearch?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SearchBar({ placeholder = "Search by brand, model, or variant...", onSearch, onSubmit }: SearchBarProps) {
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSubmit) {
        onSubmit(searchValue);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(searchValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-10"
      />
    </form>
  );
}
