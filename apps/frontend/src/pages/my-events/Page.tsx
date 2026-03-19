import { Heading } from '@/components/ui/typography';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/backButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Plus } from 'lucide-react';
import { userService } from '@/services/userService';
import { useNavigate } from 'react-router-dom';
import { useTypedLoaderData } from '@/hooks/useTypedLoaderData';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type {
  ResMyEvents,
  ResMyInvitedEvents,
  ResMyEventsPaginated,
  ResMyInvitedEventsPaginated,
} from '@grit/schema';
import { useState } from 'react';
import { EmptyState } from './components/EmptyState';
import { MyEventsSortDropdown, SortMode } from './components/MyEventsSortDropdown';
import { MyEventCard } from './components/MyEventCard';
import { useEventActions } from './hooks/useEventActions';
import { Text } from '@/components/ui/typography';
import { toast } from 'sonner';

type ResMyEvent = ResMyEvents[number];
type ResMyInvitedEvent = ResMyInvitedEvents[number];

const PAGE_SIZE = '20';

interface MyEventsLoaderData {
  upcoming: ResMyEventsPaginated;
  past: ResMyEventsPaginated;
  organizing: ResMyEventsPaginated;
  invited: ResMyInvitedEventsPaginated;
}

export const myEventsLoader = async (): Promise<MyEventsLoaderData> => {
  const [upcoming, past, organizing, invited] = await Promise.all([
    userService.getMyEvents({ tab: 'upcoming', limit: PAGE_SIZE }),
    userService.getMyEvents({ tab: 'past', limit: PAGE_SIZE }),
    userService.getMyEvents({ tab: 'organizing', limit: PAGE_SIZE }),
    userService.getMyInvitedEvents({ limit: PAGE_SIZE }),
  ]);
  return { upcoming, past, organizing, invited };
};

export function Page() {
  const loaderData = useTypedLoaderData<MyEventsLoaderData>();
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>('drafts-first');
  const [activeTab, setActiveTab] = useState('upcoming');
  const { publishEvent, unpublishEvent, optimisticUpdates } = useEventActions();
  const { acceptInvite, declineInvite } = useEventActions();

  const {
    items: upcomingEvents,
    sentinelRef: upcomingSentinel,
    isLoading: upcomingLoading,
  } = useInfiniteScroll<ResMyEvent>(
    loaderData.upcoming.data,
    loaderData.upcoming.pagination,
    async (cursor) =>
      userService.getMyEvents({
        tab: 'upcoming',
        limit: PAGE_SIZE,
        cursor,
      }),
    [activeTab],
    () => toast.error('Failed to load more upcoming events')
  );

  const {
    items: pastEvents,
    sentinelRef: pastSentinel,
    isLoading: pastLoading,
  } = useInfiniteScroll<ResMyEvent>(
    loaderData.past.data,
    loaderData.past.pagination,
    async (cursor) => userService.getMyEvents({ tab: 'past', limit: PAGE_SIZE, cursor }),
    [activeTab],
    () => toast.error('Failed to load more past events')
  );

  const {
    items: organizingEvents,
    sentinelRef: organizingSentinel,
    isLoading: organizingLoading,
  } = useInfiniteScroll<ResMyEvent>(
    loaderData.organizing.data,
    loaderData.organizing.pagination,
    async (cursor) =>
      userService.getMyEvents({
        tab: 'organizing',
        limit: PAGE_SIZE,
        cursor,
      }),
    [activeTab],
    () => toast.error('Failed to load more organizing events')
  );

  const {
    items: invitedEvents,
    sentinelRef: invitedSentinel,
    isLoading: invitedLoading,
  } = useInfiniteScroll<ResMyInvitedEvent>(
    loaderData.invited.data,
    loaderData.invited.pagination,
    async (cursor) => userService.getMyInvitedEvents({ limit: PAGE_SIZE, cursor }),
    [activeTab],
    () => toast.error('Failed to load more invitations')
  );

  const sortEvents = (eventsToSort: ResMyEvent[], isPastTab = false) => {
    return [...eventsToSort].sort((a, b) => {
      const aPublished = optimisticUpdates[a.id]?.isPublished ?? a.isPublished;
      const bPublished = optimisticUpdates[b.id]?.isPublished ?? b.isPublished;

      if (sortMode === 'drafts-first') {
        const aIsDraft = a.isOrganizer && !aPublished;
        const bIsDraft = b.isOrganizer && !bPublished;
        if (aIsDraft !== bIsDraft) return aIsDraft ? -1 : 1;
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

  const withOptimistic = (evts: ResMyEvent[]) =>
    evts.map((e) => ({ ...e, ...optimisticUpdates[e.id] }));

  const sortedUpcoming = sortEvents(withOptimistic(upcomingEvents));
  const sortedPast = sortEvents(withOptimistic(pastEvents), true);
  const sortedOrganizing = sortEvents(withOptimistic(organizingEvents));

  const hasAnyEvents =
    loaderData.upcoming.pagination.total > 0 ||
    loaderData.past.pagination.total > 0 ||
    loaderData.organizing.pagination.total > 0 ||
    loaderData.invited.pagination.total > 0;

  const renderEventsList = (
    evts: ResMyEvent[],
    sentinel: React.RefObject<HTMLDivElement | null>,
    loading: boolean
  ) => (
    <>
      {evts.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="w-12 h-12 text-muted-foreground mb-3" />
            <Text className="text-muted-foreground">No events found in this category.</Text>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {evts.map((event) => (
            <MyEventCard
              key={event.id}
              event={event}
              optimisticState={optimisticUpdates[event.id]}
              onPublish={publishEvent}
              onUnpublish={unpublishEvent}
              onEdit={(slug) => void navigate(`/events/${slug}/edit`)}
              onViewDetails={(slug) => void navigate(`/events/${slug}`)}
            />
          ))}
        </div>
      )}
      <div ref={sentinel} className="h-4" />
      {loading && <Text className="text-center text-muted-foreground mt-2">Loading more...</Text>}
    </>
  );

  const renderInvitationsList = () => (
    <>
      {invitedEvents.length === 0 && !invitedLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="w-12 h-12 text-muted-foreground mb-3" />
            <Text className="text-muted-foreground">No pending invitations</Text>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invitedEvents.map((event) => (
            <MyEventCard
              key={event.id}
              event={event}
              onAccept={acceptInvite}
              onDecline={declineInvite}
              onViewDetails={(slug) => void navigate(`/events/${slug}`)}
            />
          ))}
        </div>
      )}
      <div ref={invitedSentinel} className="h-4" />
      {invitedLoading && (
        <Text className="text-center text-muted-foreground mt-2">Loading more...</Text>
      )}
    </>
  );

  return (
    <div className="space-y-8">
      <BackButton label="Back to Profile" onClick={() => void navigate('/profile')} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Heading>My Events</Heading>
        {hasAnyEvents && (
          <Button onClick={() => void navigate('/create/event')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {!hasAnyEvents ? (
        <EmptyState />
      ) : (
        <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center md:gap-2">
            <TabsList variant="brutalist" className="w-full md:w-auto overflow-x-auto">
              <TabsTrigger
                value="upcoming"
                variant="brutalist"
                className="text-xs md:text-sm shrink-0"
              >
                Upcoming ({loaderData.upcoming.pagination.total})
              </TabsTrigger>
              <TabsTrigger
                value="organizing"
                variant="brutalist"
                className="text-xs md:text-sm shrink-0"
              >
                Organizing ({loaderData.organizing.pagination.total})
              </TabsTrigger>
              <TabsTrigger
                value="invitations"
                variant="brutalist"
                className="text-xs md:text-sm shrink-0"
              >
                Invitations ({loaderData.invited.pagination.total})
              </TabsTrigger>
              <TabsTrigger value="past" variant="brutalist" className="text-xs md:text-sm shrink-0">
                Past ({loaderData.past.pagination.total})
              </TabsTrigger>
            </TabsList>
            <MyEventsSortDropdown value={sortMode} onChange={setSortMode} />
          </div>

          <TabsContent value="upcoming" className="mt-6">
            {renderEventsList(sortedUpcoming, upcomingSentinel, upcomingLoading)}
          </TabsContent>
          <TabsContent value="past" className="mt-6">
            {renderEventsList(sortedPast, pastSentinel, pastLoading)}
          </TabsContent>
          <TabsContent value="organizing" className="mt-6">
            {renderEventsList(sortedOrganizing, organizingSentinel, organizingLoading)}
          </TabsContent>
          <TabsContent value="invitations" className="mt-6">
            {renderInvitationsList()}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
