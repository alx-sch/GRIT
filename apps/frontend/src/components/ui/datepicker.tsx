import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export interface DatePickerProps {
  selected?: DateRange;
  onSelect?: (date: DateRange | undefined) => void;
  placeholder?: string;
}

export function DatePicker({ selected, onSelect, placeholder }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="">
          <CalendarIcon />
          {selected?.from ? (
            <span>
              {format(selected.from, 'LLL dd, y')}{' '}
              {selected.to ? ' - ' + format(selected.to, 'LLL dd, y') : ''}
            </span>
          ) : (
            <span>{placeholder || ''}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={onSelect}
          numberOfMonths={1}
          fixedWeeks
        />
      </PopoverContent>
    </Popover>
  );
}
