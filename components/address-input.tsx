"use client";

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import { AddressSuggestions } from "./address-suggestions";

export interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
  showSuggestions?: boolean;
  onSuggestionsChange?: (query: string) => void;
}

export function AddressInput({
  value,
  onChange,
  onAddressSelect,
  onClear,
  placeholder = "输入地址或地名...",
  disabled = false,
  suggestions = [],
  showSuggestions = true,
  onSuggestionsChange,
}: AddressInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const showClearButton = value.length > 0 && !disabled;
  const shouldShowSuggestions = showSuggestions && isFocused && suggestions.length > 0;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      onSuggestionsChange?.(newValue);
      setHighlightedIndex(-1);
    },
    [onChange, onSuggestionsChange]
  );

  const handleClear = useCallback(() => {
    onChange("");
    onClear?.();
    onSuggestionsChange?.("");
    inputRef.current?.focus();
  }, [onChange, onClear, onSuggestionsChange]);

  const handleSuggestionSelect = useCallback(
    (address: string) => {
      onChange(address);
      onAddressSelect(address);
      setHighlightedIndex(-1);
      setIsFocused(false);
      inputRef.current?.blur();
    },
    [onChange, onAddressSelect]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!shouldShowSuggestions) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < suggestions.slice(0, 6).length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.slice(0, 6).length) {
            handleSuggestionSelect(suggestions[highlightedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setHighlightedIndex(-1);
          setIsFocused(false);
          inputRef.current?.blur();
          break;
      }
    },
    [shouldShowSuggestions, highlightedIndex, suggestions, handleSuggestionSelect]
  );

  useEffect(() => {
    if (!isFocused) {
      setHighlightedIndex(-1);
    }
  }, [isFocused]);

  return (
    <div className="relative w-full">
      <div
        className={`
          flex items-center h-11 px-4 bg-background-card rounded-md border transition-colors duration-150
          ${
            isFocused && !disabled
              ? "border-primary-500 ring-2 ring-primary-100"
              : "border-border-default"
          }
          ${disabled ? "bg-background-skeleton cursor-not-allowed" : ""}
        `}
      >
        {/* Search icon */}
        <svg
          className={`w-5 h-5 flex-shrink-0 ${disabled ? "text-text-disabled" : "text-text-tertiary"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setIsFocused(false), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 h-full px-3 bg-transparent border-none outline-none text-base text-text-primary
            placeholder:text-text-tertiary
            ${disabled ? "cursor-not-allowed" : ""}
          `}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        {/* Clear button */}
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 p-1 -mr-1 rounded-full hover:bg-primary-50 transition-colors"
            aria-label="清除输入"
          >
            <svg
              className="w-5 h-5 text-text-tertiary hover:text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* GPS button */}
        <button
          type="button"
          className={`
            flex-shrink-0 p-2 -mr-2 rounded-md transition-colors
            ${disabled ? "text-text-disabled" : "text-text-secondary hover:bg-primary-50 hover:text-primary-500"}
          `}
          disabled={disabled}
          aria-label="使用当前位置"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Suggestions dropdown */}
      <AddressSuggestions
        suggestions={suggestions}
        visible={shouldShowSuggestions}
        highlightedIndex={highlightedIndex}
        onSelect={handleSuggestionSelect}
        onMouseEnter={setHighlightedIndex}
      />
    </div>
  );
}
