import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TimeSelectProps {
  value?: string;
  onChange?: (time: string) => void;
  className?: string;
  /** Time increment in minutes (default: 30) */
  increment?: number;
}

/** Generate time options for 24-hour format */
function generateTimeOptions(increment: number): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += increment) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
    }
  }
  return options;
}

export function TimeSelect({
  value = '12:00',
  onChange,
  className,
  increment = 30,
}: TimeSelectProps) {
  const timeOptions = React.useMemo(() => generateTimeOptions(increment), [increment]);

  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        'h-10 rounded-none border-2 border-border bg-secondary px-2 py-1 text-sm font-medium',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        'cursor-pointer appearance-none',
        className
      )}
    >
      {timeOptions.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  );
}
