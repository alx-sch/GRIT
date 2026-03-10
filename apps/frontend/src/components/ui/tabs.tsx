import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: 'default' | 'brutalist' }
>(({ className, variant = 'default', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center',
      variant === 'default' && 'h-9 justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      variant === 'brutalist' &&
        'gap-2 overflow-x-auto w-full md:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: 'default' | 'brutalist';
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap transition-all flex-shrink-0',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      variant === 'default' &&
        'rounded-md px-3 py-1 text-sm font-medium ring-offset-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
      variant === 'brutalist' && [
        'button-txt px-2 py-2 sm:px-4 sm:py-2.5',
        'border-2 border-border bg-background',
        'hover:bg-accent',
        'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
        'data-[state=active]:shadow-grit data-[state=active]:-translate-x-[2px] data-[state=active]:-translate-y-[2px]',
      ],
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
