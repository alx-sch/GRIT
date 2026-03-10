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
      variant="outline"
      icon={ArrowUpDown}
      showSearch={false}
      className="w-full md:w-auto md:min-w-40 text-sm font-normal"
    />
  );
}
