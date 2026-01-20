import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import * as React from 'react';

import { buttonVariants } from '@/components/ui/button';

import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'rounded-none border-2 border-border bg-background p-3 font-heading shadow-grit',
        className
      )}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-6',
        month: 'flex flex-col gap-4',
        caption: 'flex justify-center pt-1 relative items-center w-full text-foreground',
        caption_label: 'text-sm font-heading font-bold',
        caption_dropdowns: 'flex gap-2 justify-center',
        dropdown:
          'appearance-none bg-background border-2 border-border rounded-none px-3 py-1 text-sm font-heading focus:outline-none focus:ring-2 focus:ring-ring',
        nav: 'gap-1 flex items-center',
        nav_button: cn(buttonVariants({ variant: 'ghost' }), 'h-7 w-7 bg-transparent p-0'),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground text-center w-9 font-heading text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn('relative p-0 text-center text-sm focus-within:relative focus-within:z-20'),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-heading font-medium aria-selected:opacity-100'
        ),
        day_range_start:
          'day-range-start aria-selected:!bg-black aria-selected:!text-white aria-selected:dark:!bg-white aria-selected:dark:!text-black',
        day_range_end:
          'day-range-end aria-selected:!bg-black aria-selected:!text-white aria-selected:dark:!bg-white aria-selected:dark:!text-black',
        day_selected: '!bg-black !text-white dark:!bg-white dark:!text-black',
        day_today: 'bg-accent border-2 border-border text-foreground font-semibold',
        day_outside: 'day-outside text-foreground opacity-50 aria-selected:bg-none',
        day_disabled: 'text-foreground opacity-50',
        day_range_middle:
          'aria-selected:!bg-black/50 aria-selected:!text-white aria-selected:dark:!bg-white/50 aria-selected:dark:!text-black',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn('size-4', className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn('size-4', className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
