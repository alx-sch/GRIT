import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heading, Text } from '@/components/ui/typography';
import type { ResUserPublic, ResUserPublicEvents } from '@grit/schema';
import { PublicEventCard } from './PublicEventCard';

interface ProfileTabsProps {
  user: ResUserPublic;
  events: ResUserPublicEvents;
}

export function ProfileTabs({ user, events }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList variant="brutalist" className="w-full md:w-auto">
        <TabsTrigger value="info" variant="brutalist" className="text-xs md:text-sm">
          Info
        </TabsTrigger>
        <TabsTrigger value="events" variant="brutalist" className="text-xs md:text-sm">
          Events ({events.length})
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
        {events.length === 0 ? (
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
      </TabsContent>
    </Tabs>
  );
}
