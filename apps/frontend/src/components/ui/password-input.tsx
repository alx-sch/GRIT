import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  /** Optional className for the wrapper div */
  wrapperClassName?: string;
}

/**
 * PasswordInput component with built-in visibility toggle.
 *
 * Automatically handles password visibility state with an eye icon toggle button.
 * Wraps the Input component and preserves all its functionality including error states.
 *
 * @example
 * ```tsx
 * <PasswordInput
 *   id="password"
 *   autoComplete="current-password"
 *   error={!!errors.password}
 *   {...register('password')}
 * />
 * ```
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, wrapperClassName, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className={cn('relative', wrapperClassName)}>
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => {
            setShowPassword(!showPassword);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
