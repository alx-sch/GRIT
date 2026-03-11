import { CheckIcon } from 'lucide-react';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import type { buttonVariants } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export interface ComboboxOptions {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOptions[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  showSelectedTick?: boolean;
  footer?: React.ReactNode;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  icon?: LucideIcon;
  showSearch?: boolean;
  onMenuScrollToBottom?: () => void;
  isLoading?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  className,
  showSelectedTick = false,
  footer,
  variant = 'outline',
  icon: Icon,
  showSearch = true,
  onMenuScrollToBottom,
  isLoading = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  // FOR LOCATIONS ONLY: Manual load via scroll listener.
  // When user scrolls within 100px of dropdown bottom, trigger load more.
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 100) {
      onMenuScrollToBottom?.();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full max-w-full justify-between h-12',
            variant === 'ghost' && '!px-2',
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {Icon && <Icon className="h-4 w-4 shrink-0 hidden md:block" />}
            {showSelectedTick && value ? <CheckIcon className="h-4 w-4 shrink-0" /> : null}
            {selectedLabel ?? placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) border-0 p-0 bg-secondary font-sans min-w-58">
        <Command className={cn(showSearch && '**:data-[slot=command-input-wrapper]:h-11')}>
          {showSearch && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList
            ref={listRef}
            className="p-1 max-h-64 overflow-y-auto"
            onScroll={handleScroll}
          >
            <CommandEmpty>{isLoading ? 'Loading...' : emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value === value ? '' : option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  <CheckIcon
                    className={cn('ml-auto', value === option.value ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {footer && <div className="border-t">{footer}</div>}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
