export const timestampToLocalTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return time;
};

export type DateFormat = 'default' | 'withDay' | 'dateTime' | 'short' | 'shortWithYear';

export const formatEventDate = (
  dateString: string | Date,
  format: DateFormat = 'default'
): string => {
  const date = new Date(dateString);

  switch (format) {
    case 'default':
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    case 'withDay':
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    case 'dateTime':
      return date.toLocaleString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    case 'short':
      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    case 'shortWithYear':
      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

/**
 * Formats a date to 24h time, e.g., "22:00"
 */
export const formatEventTime = (dateString: string | Date): string => {
  return new Date(dateString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Returns a pair of strings formatted for stacked display.
 * Logic:
 * - Date Line: always start date (Thu, 12 Dec 2024).
 * - Time Line:
 * - Same calendar day: `start - end` (e.g., 20:00 - 23:00)
 * - Crosses to next day: `start - end (NextDayOfWeek)` (e.g., 22:00 - 04:00 (Fri))
 * - No end date: `start`
 */
export const formatEventDateTimeStack = (startAt: string | Date, endAt?: string | Date | null) => {
  const start = new Date(startAt);
  const dateLine = formatEventDate(start, 'withDay');
  const startTimeStr = formatEventTime(start); // E.g., "22:00"

  if (!endAt) {
    return { dateLine, timeLine: startTimeStr };
  }

  const end = new Date(endAt);
  const endTimeStr = formatEventTime(end);

  if (start.toLocaleDateString('en-GB') === end.toLocaleDateString('en-GB')) {
    return { dateLine, timeLine: `${startTimeStr} - ${endTimeStr}` };
  }

  const endDayOfWeek = end.toLocaleDateString('en-GB', { weekday: 'short' }); // E.g., "Fri"
  return { dateLine, timeLine: `${startTimeStr} - ${endTimeStr} (${endDayOfWeek})` };
};
