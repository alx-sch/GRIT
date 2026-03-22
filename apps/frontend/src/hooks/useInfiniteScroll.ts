import { useEffect, useRef, useState } from 'react';

interface PaginatedItem {
  id: number | string; // Number (for events, locations), string (for friends).
}

export interface Pagination {
  nextCursor: string | null;
  hasMore: boolean;
  /** Set on first page when API returns total (e.g. hosted events count). */
  total?: number;
}

/**
 * Custom hook for infinite scroll pagination.
 * Initializes items with initialItems and pagination with initialPagination.
 * Creates the loadMore function and sets up IntersectionObserver for events
 * (auto-load). For locations, loadMore is called manually via scroll listeners.
 * Returns items, pagination, loadMore function, and sentinel ref for the
 * component to use.
 */
export function useInfiniteScroll<T extends PaginatedItem>(
  initialItems: T[], // Initial array of items (events, locations, etc.)
  initialPagination: Pagination, // Initial pagination state (cursor, hasMore flag)
  fetchMore: (cursor: string) => Promise<{
    data: T[];
    pagination: Pagination;
  }>, // A function parameter (function that fetches next page of items using
  // cursor).
  dependencies: unknown[] = [], // External values that trigger observer
  // recreation (e.g., searchParams, filters)
  onError?: (error: unknown) => void // Optional error callback for loadMore errors
) {
  const [items, setItems] = useState(() => initialItems); // All displayed items (initial + loaded)
  const [pagination, setPagination] = useState<Pagination>(() => initialPagination); // Current pagination state (nextCursor, hasMore)
  const [isLoading, setIsLoading] = useState(false); // Avoids duplicate requests if one request is currently
  // happening
  const sentinelRef = useRef<HTMLDivElement | null>(null); // Reference to sentinel div (IntersectionObserver watches this)
  const addItem = (item: T) => {
    setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
  };

  // Main function for loading more items -> takes whichever items were already
  // there, and appends the next ones to also be displayed.
  const loadMore = async () => {
    if (!pagination.hasMore || isLoading || !pagination.nextCursor) return;
    setIsLoading(true);
    try {
      const { data, pagination: newPagination } = await fetchMore(pagination.nextCursor);
      setItems((prev) => {
        const existing = new Set(prev.map((item) => item.id)); // IDs of already-displayed items
        return [...prev, ...data.filter((item) => !existing.has(item.id))]; // Appending new items (avoiding duplicates)
      });
      setPagination(newPagination);
    } catch (err) {
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  // FOR EVENTS ONLY: Auto-load via IntersectionObserver.
  // Observes sentinel (invisible div) -> when scrolling close to it ->
  // automatically calls loadMore.
  useEffect(() => {
    const el = sentinelRef.current; // Store the sentinel (if it exists)
    if (!el || typeof IntersectionObserver == 'undefined') return; // If sentinelRef does not exist OR test is running.

    const io = new IntersectionObserver(
      // Create an observer that watches elements
      (entries) => {
        // Entries -> watched elements.
        entries.forEach((entry) => {
          if (entry.isIntersecting) void loadMore(); // Trigger loadMore() when sentinel is
          // getting close to viewport.
        });
      },
      { rootMargin: '400px', threshold: 0.1 }
      // Trigger 400 px BEFORE sentinel reaches viewport, or when 10% of
      // sentinel is visible.
    );
    io.observe(el); // Set observer to watch sentinel.
    return () => {
      io.disconnect();
    };
  }, [pagination.nextCursor, pagination.hasMore, ...dependencies]); // Re-create observer when pagination or filters change
  // (dependencies)

  // Sets up the initial state (first API call OR if filter/search changes).
  useEffect(() => {
    setItems(initialItems);
    setPagination(initialPagination);
  }, [initialItems, initialPagination]); // Reset when initial data changes (filter/search change)

  return {
    items,
    isLoading,
    sentinelRef,
    pagination,
    loadMore,
    addItem,
  }; // Returns an object
}
