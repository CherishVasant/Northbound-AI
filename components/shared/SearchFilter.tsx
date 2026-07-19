'use client'

import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterOption {
  label: string
  value: string
}

interface SearchFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: {
    [key: string]: {
      label: string
      options: FilterOption[]
      value: string
      onChange: (value: string) => void
    }
  }
  onClear?: () => void
}

export function SearchFilter({
  searchValue,
  onSearchChange,
  filters,
  onClear,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 pill-soft bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filter Dropdowns */}
      {filters && Object.entries(filters).length > 0 && (
        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          {Object.entries(filters).map(([key, filter]) => (
            <select
              key={key}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="px-3 py-2 pill-soft pill-soft-interactive bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Clear Button */}
      {onClear && (searchValue || Object.values(filters || {}).some((f) => f.value)) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="w-full md:w-auto"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
