import { useState } from 'react';
import { useInfiniteScroll, type Pagination } from '@/hooks/useInfiniteScroll';
import { userService } from '@/services/userService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heading, Text } from '@/components/ui/typography';
import type { ResUserPublic, ResUserPublicEvent } from '@grit/schema';
import { PublicEventCard } from './PublicEventCard';
import { toast } from 'sonner';

interface ProfileTabsProps {
  user: ResUserPublic;
  username: string;
  initialEvents: ResUserPublicEvent[];
  initialPagination: Pagination;
}

export function ProfileTabs({
  user,
  username,
  initialEvents,
  initialPagination,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('info');

  const {
    items: events,
    sentinelRef,
    isLoading,
  } = useInfiniteScroll<ResUserPublicEvent>(
    initialEvents,
    initialPagination,
    async (cursor) => {
      const result = await userService.getUserEventsByName({ username, cursor });
      return result;
    },
    [activeTab], // recreate observer when tab becomes visible
    () => {
      toast.error('Failed to load more events');
    }
  );

  return (
    <Tabs defaultValue="info" className="w-full" onValueChange={setActiveTab}>
      <TabsList variant="brutalist" className="w-full md:w-auto">
        <TabsTrigger value="info" variant="brutalist" className="text-xs md:text-sm">
          Info
        </TabsTrigger>
        <TabsTrigger value="events" variant="brutalist" className="text-xs md:text-sm">
          Events {initialPagination.hasMore ? '' : `(${events.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-6">
        <div className="bg-card rounded-lg border p-6 space-y-4">
          {user.bio ? (
            <div>
              <Heading level={4} className="mb-2">
                About
              </Heading>
              <Text>{user.bio}</Text>
            </div>
          ) : (
            <div className="bg-card rounded-lg border p-6 text-center">
              <Text className="text-muted-foreground">This user hasn't added a bio yet.</Text>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="events" className="mt-6">
        {events.length === 0 && !isLoading ? (
          <div className="bg-card rounded-lg border p-6 text-center">
            <Text className="text-muted-foreground">No public events hosted yet.</Text>
          </div>
        ) : (
          <div className="grid gap-6 justify-start md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <PublicEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
        <div ref={sentinelRef} className="h-4" />
        {isLoading && (
          <Text className="text-center text-muted-foreground mt-4">Loading more...</Text>
        )}
      </TabsContent>
    </Tabs>
  );
}
