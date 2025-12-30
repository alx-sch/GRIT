import { useEffect, useState } from 'react';

/**
 * Custom hook that delays updating a value until a specified time has passed.
 * Useful for search inputs to prevent API calls on every keystroke.
 *
 * @param value The value to debounce (usually a string from an input)
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
