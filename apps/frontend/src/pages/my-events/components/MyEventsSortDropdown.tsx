import { Combobox, ComboboxOptions } from '@/components/ui/combobox';
import { ArrowUpDown } from 'lucide-react';

export type SortMode = 'drafts-first' | 'soonest' | 'furthest';

interface MyEventsSortDropdownProps {
  value: SortMode;
  onChange: (value: SortMode) => void;
}

const sortOptions: ComboboxOptions[] = [
  { value: 'drafts-first', label: 'Drafts First' },
  { value: 'soonest', label: 'Soonest' },
  { value: 'furthest', label: 'Furthest' },
];

export function MyEventsSortDropdown({ value, onChange }: MyEventsSortDropdownProps) {
  return (
    <Combobox
      options={sortOptions}
      value={value}
      onChange={(v) => {
        onChange(v as SortMode);
      }}
      placeholder="Sort"
      variant="ghost"
      icon={ArrowUpDown}
      showSearch={false}
      className="w-auto min-w-0 md:flex-none text-xs md:text-base font-normal"
    />
  );
}
