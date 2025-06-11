import React from 'react'
import { Search, Filter, RefreshCw, SlidersHorizontal } from 'lucide-react'

export interface FilterOption {
  label: string
  value: string
}

export interface SortOption {
  label: string
  value: string
  field: string
  order: 'asc' | 'desc'
}

interface SearchFilterBarProps {
  // Search functionality
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  
  // Filter functionality
  filters?: {
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
  }[]
  
  // Sort functionality
  sortValue?: string
  sortOptions?: SortOption[]
  onSortChange?: (value: string) => void
  
  // Additional controls
  onRefresh?: () => void
  onApplyFilters?: () => void
  
  // Layout
  className?: string
  showAdvancedFilters?: boolean
  isLoading?: boolean
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  sortValue,
  sortOptions = [],
  onSortChange,
  onRefresh,
  onApplyFilters,
  className = "",
  showAdvancedFilters = true,
  isLoading = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onApplyFilters?.()
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search Input */}
          <div className="md:col-span-5">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                className="input pl-10"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Filters */}
          {filters.map((filter, index) => (
            <div key={index} className="md:col-span-2">
              <label htmlFor={`filter-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                {filter.label}
              </label>
              <select
                id={`filter-${index}`}
                className="input"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Sort Dropdown */}
          {sortOptions.length > 0 && onSortChange && (
            <div className="md:col-span-2">
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort"
                className="input"
                value={sortValue}
                onChange={(e) => onSortChange(e.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="md:col-span-3 flex gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
            
            {onApplyFilters && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Filter className="h-4 w-4 mr-1" />
                Apply
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        {showAdvancedFilters && filters.length > 2 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Advanced Filters</span>
              </div>
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                Show More
              </button>
            </div>
          </div>
        )}

        {/* Filter Summary */}
        <div className="flex flex-wrap gap-2">
          {searchValue && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Search: "{searchValue}"
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="ml-1 h-3 w-3 text-primary-400 hover:text-primary-600"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.map((filter, index) => 
            filter.value && filter.value !== '' ? (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {filter.label}: {filter.options.find(opt => opt.value === filter.value)?.label}
                <button
                  type="button"
                  onClick={() => filter.onChange('')}
                  className="ml-1 h-3 w-3 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            ) : null
          )}
        </div>
      </form>
    </div>
  )
}

export default SearchFilterBar 