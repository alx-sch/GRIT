import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce Hook', () => {
  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('should delay updating the value', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'start' },
    });

    rerender({ value: 'end' });

    expect(result.current).toBe('start');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('end');

    vi.useRealTimers();
  });
});
