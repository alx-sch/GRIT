import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';

export function useSearchParam(key: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get(key) ?? '');
  const debouncedInput = useDebounce(input, 500);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInput(searchParams.get(key) ?? '');
  }, [searchParams.get(key)]);

  useEffect(() => {
    const urlValue = searchParams.get(key) ?? '';
    if (debouncedInput === urlValue) return;
    isInternalUpdate.current = true;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedInput) next.set(key, debouncedInput);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  }, [debouncedInput]);

  return [input, setInput, debouncedInput] as const;
}
