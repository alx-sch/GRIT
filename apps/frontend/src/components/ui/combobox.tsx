import { CheckIcon, ChevronDown } from 'lucide-react';

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

const frameworks = [
  {
    value: 'next.js',
    label: 'Next.js',
  },
  {
    value: 'sveltekit',
    label: 'SvelteKit',
  },
  {
    value: 'nuxt.js',
    label: 'Nuxt.js',
  },
  {
    value: 'remix',
    label: 'Remix',
  },
  {
    value: 'astro',
    label: 'Astro',
  },
];

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
  emptyMessage: string;

}

export function Combobox({ options, value, onChange, placeholder, searchPlaceholder, emptyMessage }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
//  const [value, setValue] = React.useState('');

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between md:max-w-[200px]"
        >
			{selectedLabel ?? placeholder}
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) border-0 p-0 bg-secondary font-sans">
        <Command className="**:data-[slot=command-input-wrapper]:h-11">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="p-1">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((options) => (
                <CommandItem
                  key={options.value}
                  value={options.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  {options.label}
                  <CheckIcon
                    className={cn(
                      'ml-auto',
                      value === options.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
