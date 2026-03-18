import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, clearable, onClear, ...props }, ref) => {
    // Derive directly from controlled value — no native listeners needed
    const showClear = clearable && !!props.value;

    if (clearable) {
      return (
        <div className={cn('relative', className)}>
          <input
            type={type}
            className={cn(
              'flex h-12 w-full px-3 py-2 text-base',
              'bg-background text-foreground',
              'dark:bg-white/5',
              'rounded-none border-2',
              'border-input',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-0',
              'focus-visible:border-primary',
              'focus-visible:shadow-grit',
              'dark:focus-visible:shadow-none',
              'transition-all duration-200',
              error &&
                'border-destructive focus-visible:border-destructive focus-visible:shadow-[4px_4px_0px_0px_var(--destructive)]',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'pr-10'
            )}
            style={{ fontSize: '16px' }}
            ref={ref}
            {...props}
          />
          {showClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full px-3 py-2 text-base',
          'bg-background text-foreground',
          'dark:bg-white/5',
          'rounded-none border-2',
          'border-input',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-0',
          'focus-visible:border-primary',
          'focus-visible:shadow-grit',
          'dark:focus-visible:shadow-none',
          'transition-all duration-200',
          error &&
            'border-destructive focus-visible:border-destructive focus-visible:shadow-[4px_4px_0px_0px_var(--destructive)]',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        style={{ fontSize: '16px' }}
        ref={ref}
        {...props}
      />
    );
  }
);
