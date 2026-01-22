import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

export interface DatePickerProps {
  selected?: DateRange;
  onSelect?: (date: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ selected, onSelect, placeholder, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const trigger = (
    <Button
      variant="outline"
      className={cn('border-2 border-border rounded-none h-12 px', className)}
    >
      {selected?.from ? (
        <span>
          {isMobile
            ? selected.to
              ? `${format(selected.from, 'MMM dd')} - ${format(selected.to, 'MMM dd')}`
              : `From ${format(selected.from, 'MMM dd')}`
            : selected.to
              ? `${format(selected.from, 'LLL dd, y')} - ${format(selected.to, 'LLL dd, y')}`
              : `From ${format(selected.from, 'LLL dd, y')}`}
        </span>
      ) : (
        <>
          <CalendarIcon className="shrink-0" />
          {<span className="uppercase">{placeholder}</span>}
        </>
      )}
    </Button>
  );

  const calendar = (
    <Calendar
      mode="range"
      selected={selected}
      onSelect={onSelect}
      numberOfMonths={isMobile ? 1 : 2}
      className={
        isMobile
          ? 'border-0 shadow-none mx-auto [--rdp-cell-size:clamp(0px,calc(100vw/8),52px)]'
          : ''
      }
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="flex flex flex-col items-center p-2 pb-8">
          <div className="flex justify-center w-full">{calendar}</div>
          <div className="w-full flex justify-end mt-4 px-2">
            <Button
              type="button"
              onClick={() => {
                setOpen(false);
              }}
              disabled={!selected?.from}
              variant="secondary"
            >
              Select
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0 shadow-none" align="start">
        {calendar}
      </PopoverContent>
    </Popover>
  );
}
