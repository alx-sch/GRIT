import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DateRange, Matcher } from 'react-day-picker';
import { format } from 'date-fns';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

export interface DatePickerProps {
  selected?: DateRange;
  onSelect?: (date: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: Matcher | Matcher[];
  /** When true, selecting a single date sets both start and end to same day */
  singleDateAsRange?: boolean;
}

export function DatePicker({
  selected,
  onSelect,
  placeholder,
  className,
  disabled,
  singleDateAsRange = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Compare dates ignoring time component
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  // Handle range selection to allow same-day events
  const handleSelect = (range: DateRange | undefined) => {
    // If selection was cleared and we only had a start date (no end),
    // user is clicking on start date to make a same-day event
    if (!range && selected?.from && !selected?.to) {
      onSelect?.({ from: selected.from, to: selected.from });
      return;
    }

    // If selection was cleared but we had a complete range,
    // user clicked on start date - make it a same-day event
    if (!range && selected?.from && selected?.to) {
      onSelect?.({ from: selected.from, to: selected.from });
      return;
    }

    // If we have a complete range and user clicks on start date,
    // react-day-picker gives us just { from: startDate }
    // Make it a same-day event on that date
    if (range?.from && !range?.to && selected?.from && selected?.to) {
      if (isSameDay(range.from, selected.from)) {
        onSelect?.({ from: range.from, to: range.from });
        return;
      }
    }

    // If singleDateAsRange is enabled and only start date is selected,
    // automatically set end date to same as start
    if (singleDateAsRange && range?.from && !range?.to) {
      onSelect?.({ from: range.from, to: range.from });
      return;
    }

    onSelect?.(range);
  };

  const trigger = (
    <Button
      variant="outline"
      className={cn('border-2 border-border rounded-none h-12 px max-w-full', className)}
    >
      {selected?.from ? (
        <span className="truncate">
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
      onSelect={handleSelect}
      numberOfMonths={isMobile ? 1 : 2}
      disabled={disabled}
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
      <PopoverContent className="w-auto p-0 border-0 shadow-none" align="end" collisionPadding={16}>
        {calendar}
      </PopoverContent>
    </Popover>
  );
}
