'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface FilterPanelProps {
  brands: string[];
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  onPriceChange: (min: number | undefined, max: number | undefined) => void;
  selectedRam: number[];
  onRamChange: (ram: number[]) => void;
  selectedRom: number[];
  onRomChange: (rom: number[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}

export default function FilterPanel({
  brands,
  selectedBrands,
  onBrandsChange,
  minPrice,
  maxPrice,
  onPriceChange,
  selectedRam,
  onRamChange,
  selectedRom,
  onRomChange,
  sortBy,
  onSortChange,
  onClearFilters,
}: FilterPanelProps) {
  const ramOptions = [4, 6, 8, 12, 16];
  const romOptions = [64, 128, 256, 512, 1024];

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter(b => b !== brand));
    } else {
      onBrandsChange([...selectedBrands, brand]);
    }
  };

  const toggleRam = (ram: number) => {
    if (selectedRam.includes(ram)) {
      onRamChange(selectedRam.filter(r => r !== ram));
    } else {
      onRamChange([...selectedRam, ram]);
    }
  };

  const toggleRom = (rom: number) => {
    if (selectedRom.includes(rom)) {
      onRomChange(selectedRom.filter(r => r !== rom));
    } else {
      onRomChange([...selectedRom, rom]);
    }
  };

  const hasActiveFilters = selectedBrands.length > 0 || minPrice !== undefined || maxPrice !== undefined || selectedRam.length > 0 || selectedRom.length > 0;

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest Updated</SelectItem>
            <SelectItem value="priceLow">Price: Low to High</SelectItem>
            <SelectItem value="priceHigh">Price: High to Low</SelectItem>
            <SelectItem value="brandAZ">Brand: A to Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Brands */}
      <div className="space-y-2">
        <Label>Brands</Label>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => (
            <Badge
              key={brand}
              variant={selectedBrands.includes(brand) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleBrand(brand)}
            >
              {brand}
              {selectedBrands.includes(brand) && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price Range</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice || ''}
            onChange={(e) => onPriceChange(e.target.value ? Number(e.target.value) : undefined, maxPrice)}
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice || ''}
            onChange={(e) => onPriceChange(minPrice, e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      {/* RAM */}
      <div className="space-y-2">
        <Label>RAM (GB)</Label>
        <div className="flex flex-wrap gap-2">
          {ramOptions.map((ram) => (
            <Badge
              key={ram}
              variant={selectedRam.includes(ram) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleRam(ram)}
            >
              {ram}GB
              {selectedRam.includes(ram) && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      </div>

      {/* ROM */}
      <div className="space-y-2">
        <Label>Storage (GB)</Label>
        <div className="flex flex-wrap gap-2">
          {romOptions.map((rom) => (
            <Badge
              key={rom}
              variant={selectedRom.includes(rom) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleRom(rom)}
            >
              {rom}GB
              {selectedRom.includes(rom) && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
