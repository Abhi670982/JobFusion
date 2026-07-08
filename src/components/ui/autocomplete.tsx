import * as React from "react";
import { useState, useEffect, useRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface AutocompleteInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onSelect"> {
  dataSource: string | string[] | ((query: string) => Promise<string[]>);
  debounceDelay?: number;
  maxResults?: number;
  onSelect?: (value: string) => void;
  wrapperClassName?: string;
  dropdownClassName?: string;
  dropdownDirection?: "up" | "down";
  customRender?: (item: string, isHighlighted: boolean, matchHighlight: React.ReactNode) => React.ReactNode;
}

// Regex escaping helper
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Substring matching highlighter
export function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <span>{text}</span>;
  
  const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <strong key={i} className="text-primary font-bold bg-primary/8 dark:bg-primary/20 px-0.5 rounded">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// Cache map for autocomplete query results across components
const autocompleteCache = new Map<string, string[]>();

export const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(
  (
    {
      dataSource,
      debounceDelay = 200,
      maxResults = 10,
      onSelect,
      wrapperClassName,
      dropdownClassName,
      dropdownDirection = "down",
      className,
      onChange,
      onKeyDown,
      onFocus,
      onBlur,
      value,
      defaultValue,
      customRender,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState<string>(
      value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : ""
    );
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current!);

    const listboxId = useId();
    
    // Keep internal input value in sync with external value prop
    useEffect(() => {
      if (value !== undefined) {
        setInputValue(String(value));
      }
    }, [value]);

    // Handle clicks outside the component to close the suggestion dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setActiveIndex(-1);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Perform debounced suggestions fetching
    useEffect(() => {
      const trimmedQuery = inputValue.trim();
      
      // If query is empty, close the dropdown and clear suggestions
      if (trimmedQuery.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const abortController = new AbortController();

      const fetchTimeout = setTimeout(async () => {
        const cacheKey = `${typeof dataSource === "string" ? dataSource : "custom"}:${trimmedQuery.toLowerCase()}:${maxResults}`;
        
        // Use cached result if available
        if (autocompleteCache.has(cacheKey)) {
          setSuggestions(autocompleteCache.get(cacheKey) || []);
          setLoading(false);
          return;
        }

        try {
          let results: string[] = [];

          if (Array.isArray(dataSource)) {
            // Local static array matching
            const lowerQuery = trimmedQuery.toLowerCase();
            results = dataSource
              .filter((item) => item.toLowerCase().includes(lowerQuery))
              .slice(0, maxResults);
          } else if (typeof dataSource === "function") {
            // Custom async data fetching function
            results = await dataSource(trimmedQuery);
            results = results.slice(0, maxResults);
          } else if (typeof dataSource === "string") {
            // Fetch from global backend suggestions API endpoint
            const res = await fetch(
              `/api/suggestions?category=${dataSource}&q=${encodeURIComponent(trimmedQuery)}&limit=${maxResults}`,
              { signal: abortController.signal }
            );
            if (res.ok) {
              const data = await res.json();
              if (data.success && Array.isArray(data.suggestions)) {
                results = data.suggestions;
              }
            }
          }

          // Cache and set state
          autocompleteCache.set(cacheKey, results);
          setSuggestions(results);
        } catch (error: any) {
          if (error.name === 'AbortError' || error.message?.includes('Failed to fetch')) {
            // Ignore fetch abortion or unmount errors
            return;
          }
          console.error("Autocomplete fetch error:", error);
        } finally {
          if (!abortController.signal.aborted) {
            setLoading(false);
          }
        }
      }, debounceDelay);

      return () => {
        clearTimeout(fetchTimeout);
        abortController.abort();
      };
    }, [inputValue, dataSource, debounceDelay, maxResults]);

    const selectSuggestion = (val: string) => {
      setInputValue(val);
      setIsOpen(false);
      setActiveIndex(-1);
      
      // Notify parent callbacks
      if (onSelect) {
        onSelect(val);
      }

      // Fire a synthetic input change event to keep form controllers happy
      const inputEl = inputRef.current;
      if (inputEl) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(inputEl, val);
          const event = new Event("input", { bubbles: true });
          inputEl.dispatchEvent(event);
        } else {
          inputEl.value = val;
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (onKeyDown) onKeyDown(e);

      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          setIsOpen(true);
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (suggestions.length > 0 ? (prev + 1) % suggestions.length : -1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          suggestions.length > 0 ? (prev - 1 + suggestions.length) % suggestions.length : -1
        );
      } else if (e.key === "Enter") {
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault();
          selectSuggestion(suggestions[activeIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      } else if (e.key === "Tab") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    return (
      <div ref={wrapperRef} className={cn("relative w-full flex-1", wrapperClassName)}>
        <input
          {...props}
          ref={inputRef}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
            if (onChange) onChange(e);
          }}
          onFocus={(e) => {
            setIsOpen(true);
            setActiveIndex(-1);
            if (onFocus) onFocus(e);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 && isOpen ? `${listboxId}-item-${activeIndex}` : undefined
          }
        />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground pointer-events-none">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        )}

        {isOpen && (suggestions.length > 0 || (!loading && inputValue.trim().length > 0)) && (
          <ul
            id={listboxId}
            role="listbox"
            className={cn(
              "absolute left-0 right-0 z-[9999] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl p-1 max-h-56 overflow-y-auto animate-in fade-in duration-150",
              dropdownDirection === "up"
                ? "bottom-full mb-1.5 top-auto mt-0 slide-in-from-bottom-1"
                : "top-full mt-1.5 bottom-auto mb-0 slide-in-from-top-1",
              dropdownClassName
            )}
          >
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => {
                const isHighlighted = activeIndex === idx;
                const matchHighlight = <HighlightedText text={item} highlight={inputValue} />;
                
                return (
                  <li
                    key={item}
                    id={`${listboxId}-item-${idx}`}
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur before selection
                      selectSuggestion(item);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex justify-between items-center cursor-pointer select-none font-medium touch-auto",
                      isHighlighted
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {customRender ? (
                      customRender(item, isHighlighted, matchHighlight)
                    ) : (
                      <span className="capitalize">{matchHighlight}</span>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-3 text-xs text-muted-foreground text-center select-none font-medium">
                No results found for &ldquo;{inputValue}&rdquo;
              </li>
            )}
          </ul>
        )}
      </div>
    );
  }
);

AutocompleteInput.displayName = "AutocompleteInput";
