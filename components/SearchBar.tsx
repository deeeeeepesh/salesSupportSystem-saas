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

export default function SearchBar({ placeholder = "Search by brand, model, or variant...", onSubmit }: SearchBarProps) {
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

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
        className="pl-10"
      />
    </form>
  );
}
