import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // 1. SIZE & TEXT
          'flex h-12 w-full px-3 py-2 text-base',
          // 2. COLORS & VISIBILITY
          'bg-background text-foreground',
          'dark:bg-white/5',
          // 3. BORDER
          'rounded-none border-2',
          'border-input',

          // 4. PLACEHOLDER
          'placeholder:text-muted-foreground',

          // 5. INTERACTION
          'focus-visible:outline-none focus-visible:ring-0',
          'focus-visible:border-primary',
          'focus-visible:shadow-grit',
          'dark:focus-visible:shadow-none',
          'transition-all duration-200',

          // 6. ERROR STATE
          error &&
            'border-destructive focus-visible:border-destructive focus-visible:shadow-[4px_4px_0px_0px_var(--destructive)]',

          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'disabled:cursor-not-allowed disabled:opacity-50',

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
