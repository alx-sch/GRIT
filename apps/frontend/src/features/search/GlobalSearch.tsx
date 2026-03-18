import { ArrowRight, Search, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getEventImageUrl } from '@/lib/image_utils';
import { useDebounce } from '@/hooks/useDebounce';
import { eventService } from '@/services/eventService';
import { userService } from '@/services/userService';
import { cn } from '@/lib/utils';
import { AnimatedUnderline } from '@/components/ui/animatedUnderline';
import { Heading } from '@/components/ui/typography';
import type { EventBase } from '@/types/event';
import type { ResUserPublic } from '@grit/schema';
import { formatEventDate } from '@/lib/time_utils';

function formatUserLocation(user: ResUserPublic): string {
  if (user.city && user.country) return `${user.city}, ${user.country}`;
  if (user.city) return user.city;
  if (user.country) return user.country;
  return '';
}

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 5;

interface SearchResults {
  events: EventBase[];
  users: ResUserPublic[];
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ events: [], users: [] });
  const [fetchedFor, setFetchedFor] = useState('');

  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  // Global keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    Promise.all([
      eventService.getEvents({
        search: debouncedQuery,
        limit: String(RESULT_LIMIT),
        signal: controller.signal,
      }),
      userService.getUsers({
        search: debouncedQuery,
        limit: String(RESULT_LIMIT),
        signal: controller.signal,
      }),
    ])
      .then(([eventsRes, usersRes]) => {
        if (controller.signal.aborted) return;
        setResults({ events: eventsRes.data, users: usersRes.data });
        setFetchedFor(debouncedQuery);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResults({ events: [], users: [] });
        setFetchedFor(debouncedQuery);
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setQuery('');
      setResults({ events: [], users: [] });
      setFetchedFor('');
    }
  };

  const handleSelectEvent = (slug: string) => {
    onOpenChange(false);
    requestAnimationFrame(() => {
      void navigate(`/events/${slug}`);
    });
  };

  const handleSelectUser = (id: number) => {
    onOpenChange(false);
    requestAnimationFrame(() => {
      void navigate(`/users/${String(id)}`);
    });
  };

  const handleSeeAll = (basePath: string) => {
    onOpenChange(false);
    const targetPath = basePath === '/users' ? '/profile/my-friends' : basePath;
    requestAnimationFrame(() => {
      void navigate(`${targetPath}?search=${encodeURIComponent(query)}`);
    });
  };

  const hasResults = results.events.length > 0 || results.users.length > 0;
  const isQueryTooShort = query.length > 0 && query.length < MIN_QUERY_LENGTH;
  // Loading: debounced query hasn't caught up to typed query, or fetch hasn't returned yet
  const isLoading =
    debouncedQuery.length >= MIN_QUERY_LENGTH &&
    (query !== debouncedQuery || fetchedFor !== debouncedQuery);

  const displayedEvents = debouncedQuery.length >= MIN_QUERY_LENGTH ? results.events : [];
  const displayedUsers = debouncedQuery.length >= MIN_QUERY_LENGTH ? results.users : [];

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Global search"
      description="Search for events and people"
      shouldFilter={false}
    >
      <CommandInput placeholder="Search events, people…" value={query} onValueChange={setQuery} />
      <CommandList>
        {!isLoading && (
          <CommandEmpty>
            {isQueryTooShort
              ? 'Keep typing to search…'
              : query.length === 0
                ? 'Start typing to search…'
                : 'No results found.'}
          </CommandEmpty>
        )}

        {isLoading && (
          <div className="py-6 text-center text-sm text-main-foreground opacity-50">Searching…</div>
        )}

        {!isLoading && hasResults && (
          <>
            {displayedEvents.length > 0 && (
              <CommandGroup>
                <div className="flex items-center justify-between px-3 py-2">
                  <Heading level={4} className="uppercase">
                    Events
                  </Heading>
                  <button
                    onClick={() => {
                      handleSeeAll('/events');
                    }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors shrink-0"
                  >
                    See all <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {displayedEvents.map((event) => (
                  <CommandItem
                    key={event.id}
                    value={`event-${String(event.id)}-${event.title}`}
                    onSelect={() => {
                      handleSelectEvent(event.slug);
                    }}
                  >
                    <UserAvatar
                      user={{ name: event.title }}
                      src={getEventImageUrl(event)}
                      size="xs"
                      className="rounded-[3px] shrink-0"
                      fallbackClassName="rounded-[3px]"
                    />
                    <span className="truncate font-medium">{event.title}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {formatEventDate(event.startAt)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {displayedEvents.length > 0 && displayedUsers.length > 0 && <CommandSeparator />}

            {displayedUsers.length > 0 && (
              <CommandGroup>
                <div className="flex items-center justify-between px-3 py-2">
                  <Heading level={4} className="uppercase">
                    People
                  </Heading>
                  <button
                    onClick={() => {
                      handleSeeAll('/users');
                    }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors shrink-0"
                  >
                    See all <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {displayedUsers.map((user) => {
                  const location = formatUserLocation(user);
                  return (
                    <CommandItem
                      key={user.id}
                      value={`user-${String(user.id)}-${user.name}`}
                      onSelect={() => {
                        handleSelectUser(user.id);
                      }}
                    >
                      <UserAvatar user={user} size="xs" className="shrink-0" />
                      <span className="truncate font-medium">{user.name}</span>
                      {location ? (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {location}
                        </span>
                      ) : (
                        <User className="ml-auto shrink-0 h-3 w-3 text-muted-foreground opacity-40" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function GlobalSearchTrigger({
  onClick,
  variant = 'nav',
  className,
}: {
  onClick: () => void;
  variant?: 'nav' | 'mobile';
  className?: string;
}) {
  if (variant === 'mobile') {
    return (
      <Button variant="outline" size="icon" onClick={onClick} aria-label="Search">
        <Search className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className={cn('relative group', className)}>
      <button
        onClick={onClick}
        aria-label="Search"
        className={cn(
          navigationMenuTriggerStyle(),
          'relative bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent',
          'rounded-none text-base font-bold h-auto px-4 pb-1',
          'flex items-center justify-center'
        )}
      >
        <Search className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <AnimatedUnderline isActive={false} />
    </div>
  );
}
