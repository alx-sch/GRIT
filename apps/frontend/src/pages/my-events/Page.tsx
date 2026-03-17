import { Heading } from '@/components/ui/typography';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/backButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Plus } from 'lucide-react';
import { userService } from '@/services/userService';
import { useNavigate } from 'react-router-dom';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { useInfiniteScroll, Pagination } from '@/hooks/useInfiniteScroll';
import type { ResMyEvents, ResMyInvitedEvents } from '@grit/schema';
import { useState } from 'react';
import { EmptyState } from './components/EmptyState';
import { MyEventsSortDropdown, SortMode } from './components/MyEventsSortDropdown';
import { MyEventCard } from './components/MyEventCard';
import { useEventActions } from './hooks/useEventActions';
import { Text } from '@/components/ui/typography';
import { toast } from 'sonner';

type ResMyEvent = ResMyEvents[number];
type ResMyInvitedEvent = ResMyInvitedEvents[number];

interface MyEventsLoaderData {
  myEvents: ResMyEvents;
  myEventsPagination: Pagination;
  invitedEvents: ResMyInvitedEvents;
  invitedEventsPagination: Pagination;
}

const PAGE_SIZE = '20';

export const myEventsLoader = async (): Promise<MyEventsLoaderData> => {
  const [myEventsResponse, invitedEventsResponse] = await Promise.all([
    userService.getMyEvents({ limit: PAGE_SIZE }),
    userService.getMyInvitedEvents({ limit: PAGE_SIZE }),
  ]);

  return {
    myEvents: myEventsResponse.data,
    myEventsPagination: myEventsResponse.pagination,
    invitedEvents: invitedEventsResponse.data,
    invitedEventsPagination: invitedEventsResponse.pagination,
  };
};

export function Page() {
  const loaderData = useTypedLoaderData<MyEventsLoaderData>();
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>('drafts-first');
  const { publishEvent, unpublishEvent, optimisticUpdates } = useEventActions();
  const { acceptInvite, declineInvite } = useEventActions();

  // Infinite scroll for my events
  const {
    items: events,
    sentinelRef: eventsSentinelRef,
    isLoading: eventsLoading,
  } = useInfiniteScroll<ResMyEvent>(
    loaderData.myEvents,
    loaderData.myEventsPagination,
    async (cursor) => {
      const response = await userService.getMyEvents({ limit: PAGE_SIZE, cursor });
      return response;
    },
    [],
    (error) => {
      console.error('Failed to load more events', error);
      toast.error('Failed to load more events');
    }
  );

  // Infinite scroll for invited events
  const {
    items: invitedEvents,
    sentinelRef: invitedSentinelRef,
    isLoading: invitedLoading,
  } = useInfiniteScroll<ResMyInvitedEvent>(
    loaderData.invitedEvents,
    loaderData.invitedEventsPagination,
    async (cursor) => {
      const response = await userService.getMyInvitedEvents({ limit: PAGE_SIZE, cursor });
      return response;
    },
    [],
    (error) => {
      console.error('Failed to load more invited events', error);
      toast.error('Failed to load more invited events');
    }
  );

  const now = new Date();

  const sortEvents = (eventsToSort: ResMyEvents, isPastTab = false) => {
    return [...eventsToSort].sort((a, b) => {
      const aPublished = optimisticUpdates[a.id]?.isPublished ?? a.isPublished;
      const bPublished = optimisticUpdates[b.id]?.isPublished ?? b.isPublished;

      if (sortMode === 'drafts-first') {
        const aIsDraft = a.isOrganizer && !aPublished;
        const bIsDraft = b.isOrganizer && !bPublished;
        if (aIsDraft !== bIsDraft) {
          return aIsDraft ? -1 : 1;
        }
        const timeA = new Date(a.startAt).getTime();
        const timeB = new Date(b.startAt).getTime();
        return isPastTab ? timeB - timeA : timeA - timeB;
      } else if (sortMode === 'furthest') {
        return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
      } else {
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      }
    });
  };

  const getUpdatedEvents = () => {
    return events.map((event) => ({
      ...event,
      ...optimisticUpdates[event.id],
    }));
  };

  const updatedEvents = getUpdatedEvents();
  const upcomingEvents = sortEvents(
    updatedEvents.filter((event) => new Date(event.startAt) >= now),
    false
  );
  const pastEvents = sortEvents(
    updatedEvents.filter((event) => new Date(event.startAt) < now),
    true
  );
  const organizingEvents = sortEvents(
    updatedEvents.filter((event) => event.isOrganizer),
    false
  );

  const renderEventsList = (filteredEvents: ResMyEvent[]) => {
    if (filteredEvents.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="w-12 h-12 text-muted-foreground mb-3" />
            <Text className="text-muted-foreground">No events found in this category.</Text>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {filteredEvents.map((event) => (
          <MyEventCard
            key={event.id}
            event={event}
            optimisticState={optimisticUpdates[event.id]}
            onPublish={publishEvent}
            onUnpublish={unpublishEvent}
            onEdit={(slug) => {
              void navigate(`/events/${slug}/edit`);
            }}
            onViewDetails={(slug) => {
              void navigate(`/events/${slug}`);
            }}
          />
        ))}
      </div>
    );
  };

  const renderInvitationsList = (filteredEvents: ResMyInvitedEvent[]) => {
    if (filteredEvents.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="w-12 h-12 text-muted-foreground mb-3" />
            <Text className="text-muted-foreground">No pending invitations</Text>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {filteredEvents.map((event) => (
          <MyEventCard
            key={event.id}
            event={event}
            onAccept={acceptInvite}
            onDecline={declineInvite}
            onAcceptSuccess={() => {
              // Event accepted - it will be removed from invites and show in My Events on next load
            }}
            onDeclineSuccess={() => {
              // Event declined - it will be removed from invites on next load
            }}
            onViewDetails={(slug) => void navigate(`/events/${slug}`)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <BackButton label="Back to Profile" onClick={() => void navigate('/profile')} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Heading>My Events</Heading>
        {events.length > 0 && (
          <Button
            onClick={() => {
              void navigate('/create/event');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {events.length === 0 && invitedEvents.length === 0 ? (
        <EmptyState />
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center md:gap-2">
            <TabsList variant="brutalist" className="w-full md:w-auto overflow-x-auto">
              <TabsTrigger
                value="upcoming"
                variant="brutalist"
                className="text-xs md:text-sm shrink-0"
              >
                Upcoming ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger
                value="organizing"
                variant="brutalist"
                className="text-xs md:text-sm shrink-0"
              >
                Organizing ({organizingEvents.length})
              </TabsTrigger>
              <TabsTrigger
                value="invitations"
                variant="brutalist"
                className="text-xs md:text-sm shrink-0"
              >
                Invitations ({invitedEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past" variant="brutalist" className="text-xs md:text-sm shrink-0">
                Past ({pastEvents.length})
              </TabsTrigger>
            </TabsList>

            <MyEventsSortDropdown value={sortMode} onChange={setSortMode} />
          </div>

          <TabsContent value="upcoming" className="mt-6">
            {renderEventsList(upcomingEvents)}
            <div ref={eventsSentinelRef} className="h-4" />
            {eventsLoading && (
              <Text className="text-center text-muted-foreground">Loading more...</Text>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {renderEventsList(pastEvents)}
            <div ref={eventsSentinelRef} className="h-4" />
            {eventsLoading && (
              <Text className="text-center text-muted-foreground">Loading more...</Text>
            )}
          </TabsContent>

          <TabsContent value="organizing" className="mt-6">
            {renderEventsList(organizingEvents)}
            <div ref={eventsSentinelRef} className="h-4" />
            {eventsLoading && (
              <Text className="text-center text-muted-foreground">Loading more...</Text>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="mt-6">
            {renderInvitationsList(invitedEvents)}
            <div ref={invitedSentinelRef} className="h-4" />
            {invitedLoading && (
              <Text className="text-center text-muted-foreground">Loading more...</Text>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
