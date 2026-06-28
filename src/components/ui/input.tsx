import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
  enableSuggestions?: boolean;
  dropdownDirection?: 'up' | 'down';
}

const SUGGESTIONS_MAP: Record<string, string[]> = {
  skills: [
    "react", "javascript", "typescript", "node.js", "python", 
    "java", "c++", "sql", "docker", "aws", "git", "html5", 
    "css3", "next.js", "tailwind css", "mongodb", "postgresql", 
    "express.js", "django", "graphql", "figma", "machine learning"
  ],
  locations: [
    "remote", "bengaluru, karnataka", "delhi ncr", "mumbai, maharashtra", 
    "hyderabad, telangana", "pune, maharashtra", "chennai, tamil nadu", 
    "san francisco, ca", "new york, ny", "london, uk"
  ],
  roles: [
    "software engineer", "frontend developer", "backend developer", 
    "full stack developer", "data scientist", "ui/ux designer", 
    "product manager", "devops engineer", "mobile developer", 
    "ai/ml engineer"
  ]
};

function getSuggestionsCategory(id?: string, name?: string, placeholder?: string): string | null {
  const checkString = `${id || ''} ${name || ''} ${placeholder || ''}`.toLowerCase();
  
  if (checkString.includes('skill') || checkString.includes('tech') || checkString.includes('tool')) {
    return 'skills';
  }
  if (checkString.includes('location') || checkString.includes('city') || checkString.includes('country') || checkString.includes('place')) {
    return 'locations';
  }
  if (checkString.includes('role') || checkString.includes('title') || checkString.includes('headline') || checkString.includes('position') || checkString.includes('designation') || checkString.includes('job')) {
    return 'roles';
  }
  if (checkString.includes('company') || checkString.includes('school') || checkString.includes('university') || checkString.includes('college') || checkString.includes('organization')) {
    return 'companies';
  }
  if (checkString.includes('salary') || checkString.includes('ctc') || checkString.includes('package')) {
    return 'salaries';
  }
  if (checkString.includes('notice') || checkString.includes('period') || checkString.includes('join')) {
    return 'notice';
  }
  if (checkString.includes('experience') || checkString.includes('duration') || checkString.includes('years')) {
    return 'experience';
  }
  if (checkString.includes('degree') || checkString.includes('edu') || checkString.includes('qualification')) {
    return 'degrees';
  }
  if (checkString.includes('q') || checkString.includes('query') || checkString.includes('search')) {
    return 'roles'; // Fallback search to roles
  }
  
  return null;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, id, name, placeholder, wrapperClassName, enableSuggestions = true, dropdownDirection = 'down', ...props }, ref) => {
    const isTextInput = !type || type === "text" || type === "search" || type === "email" || type === "tel" || type === "url";
    const category = enableSuggestions && isTextInput ? getSuggestionsCategory(id, name, placeholder) : null;
    
    const [inputValue, setInputValue] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [filtered, setFiltered] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    
    const localRef = useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => localRef.current!);
    
    useEffect(() => {
      if (props.value !== undefined) {
        setInputValue(String(props.value));
      } else if (props.defaultValue !== undefined) {
        setInputValue(String(props.defaultValue));
      }
    }, [props.value, props.defaultValue]);

    // Real-time debounced suggestions fetching
    useEffect(() => {
      if (!category) return;
      
      const currentVal = inputValue.trim();
      setLoading(true);

      const fetchTimeout = setTimeout(async () => {
        try {
          const res = await fetch(`/api/suggestions?category=${category}&q=${encodeURIComponent(currentVal)}`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          if (data.success && Array.isArray(data.suggestions)) {
            // Convert to lowercase as requested
            setFiltered(data.suggestions.map((s: string) => s.toLowerCase()));
          }
        } catch (err) {
          // Local fallback filter if API fails or offline
          const list = SUGGESTIONS_MAP[category] || [];
          const lowerVal = currentVal.toLowerCase();
          if (!lowerVal) {
            setFiltered(list.map(s => s.toLowerCase()).slice(0, 5));
          } else {
            setFiltered(
              list
                .map(s => s.toLowerCase())
                .filter(item => item.includes(lowerVal) && item !== lowerVal)
                .slice(0, 5)
            );
          }
        } finally {
          setLoading(false);
        }
      }, 150); // 150ms debounce

      return () => clearTimeout(fetchTimeout);
    }, [inputValue, category]);

    const triggerInputChange = (val: string) => {
      const inputEl = localRef.current;
      if (!inputEl) return;

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
      
      setInputValue(val);
      setIsOpen(false);
      setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          e.preventDefault();
          triggerInputChange(filtered[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    return (
      <div className={cn("relative w-full flex-1", wrapperClassName)}>
        <input
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={localRef}
          {...props}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
            if (props.onChange) props.onChange(e);
          }}
          onFocus={(e) => {
            setIsOpen(true);
            setActiveIndex(-1);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsOpen(false);
            setActiveIndex(-1);
            if (props.onBlur) props.onBlur(e);
          }}
          onKeyDown={(e) => {
            handleKeyDown(e);
            if (props.onKeyDown) props.onKeyDown(e);
          }}
          autoComplete="off"
        />

        {isOpen && filtered.length > 0 && (
          <ul className={cn(
            "absolute left-0 right-0 z-[9999] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl p-1 max-h-56 overflow-y-auto animate-in fade-in duration-150",
            dropdownDirection === "up" 
              ? "bottom-full mb-1.5 top-auto mt-0 slide-in-from-bottom-1" 
              : "top-full mt-1.5 bottom-auto mb-0 slide-in-from-top-1"
          )}>
            {filtered.map((item, idx) => (
              <li
                key={item}
                onMouseDown={(e) => {
                  e.preventDefault();
                  triggerInputChange(item);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex justify-between items-center cursor-pointer select-none font-medium",
                  activeIndex === idx
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
