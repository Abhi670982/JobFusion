import * as React from "react"
import { cn } from "@/lib/utils"
import { AutocompleteInput } from "./autocomplete"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onSelect"> {
  wrapperClassName?: string;
  enableSuggestions?: boolean;
  dropdownDirection?: 'up' | 'down';
  onSelect?: (value: string) => void;
}

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
  ({ className, type, id, name, placeholder, wrapperClassName, enableSuggestions = true, dropdownDirection = 'down', onSelect, ...props }, ref) => {
    const isTextInput = !type || type === "text" || type === "search" || type === "email" || type === "tel" || type === "url";
    const category = enableSuggestions && isTextInput ? getSuggestionsCategory(id, name, placeholder) : null;
    
    // If suggestions are enabled and we resolved a category, delegate to AutocompleteInput
    if (category) {
      return (
        <AutocompleteInput
          {...props}
          ref={ref}
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          className={className}
          wrapperClassName={wrapperClassName}
          dataSource={category}
          dropdownDirection={dropdownDirection}
          onSelect={onSelect}
        />
      );
    }

    // Default raw input without suggestions
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
          ref={ref}
          {...props}
          autoComplete="off"
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
