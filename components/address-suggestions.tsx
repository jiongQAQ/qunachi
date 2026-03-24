"use client";

import { useEffect, useRef } from "react";

export interface AddressSuggestionsProps {
  suggestions: string[];
  visible: boolean;
  highlightedIndex: number;
  onSelect: (address: string) => void;
  onMouseEnter?: (index: number) => void;
}

export function AddressSuggestions({
  suggestions,
  visible,
  highlightedIndex,
  onSelect,
  onMouseEnter,
}: AddressSuggestionsProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex]);

  if (!visible || suggestions.length === 0) {
    return null;
  }

  const displaySuggestions = suggestions.slice(0, 6);

  return (
    <ul
      ref={listRef}
      className="absolute z-50 w-full mt-1 bg-background-card rounded-lg shadow-lg border border-border-default overflow-y-auto max-h-64 scroll-px-2"
      role="listbox"
    >
      {displaySuggestions.map((suggestion, index) => (
        <li
          key={`${suggestion}-${index}`}
          role="option"
          aria-selected={index === highlightedIndex}
          className={`
            px-4 py-3 cursor-pointer text-base transition-colors duration-100
            ${
              index === highlightedIndex
                ? "bg-primary-100 text-text-primary"
                : "text-text-primary hover:bg-primary-50"
            }
            ${index !== displaySuggestions.length - 1 ? "border-b border-border-subtle" : ""}
          `}
          onClick={() => onSelect(suggestion)}
          onMouseEnter={() => onMouseEnter?.(index)}
        >
          {suggestion}
        </li>
      ))}
    </ul>
  );
}
