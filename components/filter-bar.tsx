'use client';

import { useState, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface FilterCriteria {
  radius: number;          // 默认 500
  maxPrice?: number;       // 最大人均
  minPrice?: number;       // 最小人均
  categories?: string[];   // 选中的分类
  excludeCategories?: string[];  // 排除的分类
}

export interface FilterBarProps {
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  availableCategories?: string[];  // 可用分类列表
}

// ============================================================================
// Constants
// ============================================================================

const RADIUS_OPTIONS = [
  { label: '300m', value: 300 },
  { label: '500m', value: 500 },
  { label: '1000m', value: 1000 },
];

const PRICE_OPTIONS: { label: string; value: string; minPrice?: number; maxPrice?: number }[] = [
  { label: '不限', value: 'unlimited', minPrice: undefined, maxPrice: undefined },
  { label: '30元以下', value: 'under30', minPrice: 0, maxPrice: 30 },
  { label: '30-50元', value: '30-50', minPrice: 30, maxPrice: 50 },
  { label: '50-80元', value: '50-80', minPrice: 50, maxPrice: 80 },
  { label: '80-100元', value: '80-100', minPrice: 80, maxPrice: 100 },
  { label: '100元以上', value: 'above100', minPrice: 100, maxPrice: undefined },
];

const DEFAULT_CATEGORIES = ['川菜', '湘菜', '粤菜', '火锅', '日料', '西餐', '快餐', '小吃', '其他'];

// ============================================================================
// Dropdown Component
// ============================================================================

interface DropdownProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  isActive?: boolean;
}

function Dropdown({ label, value, options, onChange, isActive }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 h-8 px-3.5
          text-[13px] font-medium
          border rounded-full
          transition-all duration-150 ease-out
          ${isActive
            ? 'border-orange-500 text-orange-600'
            : 'border-stone-200 text-stone-600 hover:border-orange-400 hover:text-stone-800'
          }
        `}
      >
        <span>{selectedOption?.label || label}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[140px] bg-white border border-stone-200 rounded-xl shadow-lg z-40 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-3.5 py-2.5 text-left text-[13px]
                transition-colors duration-100
                ${option.value === value
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : 'text-stone-700 hover:bg-orange-50'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Category Multi-select Pills Component
// ============================================================================

interface CategorySelectProps {
  selected: string[];
  categories: string[];
  onChange: (categories: string[]) => void;
}

function CategorySelect({ selected, categories, onChange }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      onChange(selected.filter(c => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  const isActive = selected.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 h-8 px-3.5
          text-[13px] font-medium
          border rounded-full
          transition-all duration-150 ease-out
          ${isActive
            ? 'border-orange-500 text-orange-600'
            : 'border-stone-200 text-stone-600 hover:border-orange-400 hover:text-stone-800'
          }
        `}
      >
        <span>{isActive ? `已选${selected.length}个` : '全部类型'}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-white border border-stone-200 rounded-xl shadow-lg z-40 overflow-hidden">
          <div className="p-2">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`
                    px-3 py-1.5 text-[12px] font-medium rounded-full
                    transition-all duration-150
                    ${selected.includes(category)
                      ? 'bg-orange-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-orange-100'
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Excluded Tags Component
// ============================================================================

interface ExcludedTagsProps {
  tags: string[];
  onRemove: (tag: string) => void;
}

function ExcludedTags({ tags, onRemove }: ExcludedTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <span className="text-[12px] text-stone-400 self-center">已排除:</span>
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 h-[26px] px-2.5 text-[12px] text-stone-500 bg-stone-100 rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={() => onRemove(tag)}
            className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-stone-200 hover:text-stone-700 transition-colors duration-100"
            aria-label={`移除${tag}标签`}
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}

// ============================================================================
// Filter Bar Component
// ============================================================================

export default function FilterBar({
  filters,
  onFiltersChange,
  availableCategories = DEFAULT_CATEGORIES,
}: FilterBarProps) {
  // Derive active states
  const hasActivePriceFilter = filters.minPrice !== undefined || filters.maxPrice !== undefined;
  const hasActiveCategoryFilter = filters.categories && filters.categories.length > 0;

  // Handlers
  const handleRadiusChange = (radius: number) => {
    onFiltersChange({ ...filters, radius });
  };

  const handlePriceChange = (priceValue: string) => {
    const option = PRICE_OPTIONS.find(p => p.value === priceValue);
    if (option) {
      onFiltersChange({
        ...filters,
        minPrice: option.minPrice,
        maxPrice: option.maxPrice,
      });
    }
  };

  const handleCategoriesChange = (categories: string[]) => {
    onFiltersChange({ ...filters, categories });
  };

  const handleRemoveExclude = (tag: string) => {
    onFiltersChange({
      ...filters,
      excludeCategories: (filters.excludeCategories || []).filter(t => t !== tag),
    });
  };

  // Get current price label for dropdown display
  const getCurrentPriceLabel = () => {
    const option = PRICE_OPTIONS.find(p =>
      p.minPrice === filters.minPrice && p.maxPrice === filters.maxPrice
    );
    return option?.value || 'unlimited';
  };

  return (
    <div className="bg-white border-b border-stone-100 px-4 py-3">
      {/* First Row: Radius Pills + Price Dropdown */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Radius Pills */}
        <div className="flex bg-stone-100 rounded-lg p-0.5 shrink-0">
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleRadiusChange(option.value)}
              className={`
                h-7 px-3 text-[13px] font-medium
                rounded-md transition-all duration-150
                ${filters.radius === option.value
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Price Dropdown */}
        <Dropdown
          label="预算"
          value={getCurrentPriceLabel()}
          options={PRICE_OPTIONS.map(p => ({ label: p.label, value: p.value }))}
          onChange={handlePriceChange}
          isActive={hasActivePriceFilter}
        />
      </div>

      {/* Second Row: Category Select + Excluded Tags */}
      <div className="mt-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <CategorySelect
            selected={filters.categories || []}
            categories={availableCategories}
            onChange={handleCategoriesChange}
          />
        </div>

        {/* Excluded Tags */}
        <ExcludedTags
          tags={filters.excludeCategories || []}
          onRemove={handleRemoveExclude}
        />
      </div>
    </div>
  );
}

// Re-export price options for convenience
export { PRICE_OPTIONS as PRICE_OPTIONS_LIST };
