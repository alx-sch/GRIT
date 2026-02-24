import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

// The Animations
const neobrutalismAnimation = [
  'border-2 border-black',

  // --- MOBILE DEFAULT ---
  'shadow-grit -translate-x-[2px] -translate-y-[2px]',
  'active:shadow-none active:translate-x-0 active:translate-y-0',

  // --- DESKTOP OVERRIDES (md:) ---
  // Default: FLAT (No shadow)
  'md:shadow-none md:translate-x-0 md:translate-y-0',

  // Hover: POP OUT (Shadow appears)
  'md:hover:shadow-grit md:hover:-translate-x-[2px] md:hover:-translate-y-[2px]',

  'md:active:shadow-none md:active:translate-x-0 md:active:translate-y-0',
].join(' ');

const buttonVariants = cva(
  'button-txt inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: cn(neobrutalismAnimation, 'bg-primary text-primary-foreground'),
        destructive: cn(neobrutalismAnimation, 'bg-destructive text-destructive-foreground'),
        outline: cn(
          neobrutalismAnimation,
          'bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
        ),
        secondary: cn(
          neobrutalismAnimation,
          'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        ),
        selected: cn(
          neobrutalismAnimation,
          'bg-secondary text-secondary-foreground border-5 border-border dark:border-foreground'
        ),

        ghost:
          'hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-black',
        link: 'text-primary underline-offset-4 hover:underline',

        disabled: `
          bg-muted text-muted-foreground opacity-100 cursor-not-allowed border-2 border-black
          bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.1)_5px,rgba(0,0,0,0.1)_10px)]
        `,
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(asChild ? {} : { type })}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
