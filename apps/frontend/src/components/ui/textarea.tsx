import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // 1. SIZE & TEXT
        'flex h-48 w-full px-3 py-2 text-sm',
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
        className
      )}
      {...props}
    />
  );
}
Textarea.displayName = 'Textarea';

export { Textarea };
