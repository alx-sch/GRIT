import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, clearable, onClear, ...props }, ref) => {
    const [showClear, setShowClear] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Combine refs
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Show/hide clear button based on input value
    React.useEffect(() => {
      if (!clearable || !inputRef.current) return;

      const updateClearButton = () => {
        setShowClear(!!inputRef.current?.value);
      };

      updateClearButton();

      const input = inputRef.current;
      input.addEventListener('input', updateClearButton);

      return () => {
        input.removeEventListener('input', updateClearButton);
      };
    }, [clearable, props.value]);

    const handleClear = () => {
      if (inputRef.current) {
        // Clear the input value
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        if (nativeInputValueSetter) {
          const boundSetter = nativeInputValueSetter.bind(inputRef.current);
          boundSetter('');
        }

        // Trigger input event for React to detect the change
        const event = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(event);

        // Call custom onClear handler if provided
        onClear?.();

        // Focus back to input
        inputRef.current.focus();
      }
    };

    // Wrapper is needed only if clearable
    if (clearable) {
      return (
        <div className={cn('relative', className)}>
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

              // 7. CLEARABLE PADDING
              clearable && 'pr-10'
            )}
            ref={inputRef}
            {...props}
          />
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      );
    }

    // Original simple input without wrapper
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
        ref={inputRef}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
