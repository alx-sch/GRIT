import { BackButton } from '@/components/ui/backButton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heading, Text } from '@/components/ui/typography';
import { getAvatarImageUrl, getEventImageUrl } from '@/lib/image_utils';
import { friendService } from '@/services/friendService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { FriendshipStatus } from '@/types/friends';
import type { ResUserPublicEvents } from '@grit/schema';
import { format } from 'date-fns';
import { Clock, MapPin, UserCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';

export const publicProfileLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = parseInt(params.id ?? '', 10);
  if (isNaN(id)) {
    throw new Response('User not found', { status: 404 });
  }

  const [user, events] = await Promise.all([
    userService.getUserById(id),
    userService.getUserEvents(id),
  ]);

  // Only fetch friendship status if user is logged in
  let friendshipStatus: FriendshipStatus = 'none';
  const token = useAuthStore.getState().token;
  if (token) {
    try {
      const status = await userService.getFriendshipStatus(id);
      friendshipStatus = status;
    } catch (error) {
      // Network error or other issue - log but don't block page load
      console.error('Failed to fetch friendship status:', error);
      friendshipStatus = 'none';
    }
  }

  return { user, events, friendshipStatus };
};

export default function PublicProfilePage() {
  const data = useLoaderData<typeof publicProfileLoader>();
  const currentUser = useCurrentUserStore((s) => s.user);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>(data.friendshipStatus);
  const [isLoading, setIsLoading] = useState(false);

  const isViewingSelf = currentUser?.id === data.user.id;
  const isLoggedIn = !!currentUser;

  const avatarUrl = data.user.avatarKey ? getAvatarImageUrl(data.user.avatarKey) : undefined;
  const memberSince = format(new Date(data.user.createdAt), 'MMMM yyyy');

  const handleFriendAction = async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      if (friendshipStatus === 'none') {
        await friendService.sendRequest(data.user.id);
        // Only update UI after successful API response
        setFriendshipStatus('pending_sent');
        toast.success('Friend request sent');
      }
    } catch (error) {
      // Don't update UI on error - keep showing "Add Friend" button
      console.error('Failed to send friend request:', error);
      toast.error('Failed to send friend request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <BackButton />
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-muted shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={data.user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <Text className="text-4xl font-semibold text-primary">
                {data.user.name.charAt(0).toUpperCase()}
              </Text>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <Heading level={2}>{data.user.name}</Heading>

            {isLoggedIn && !isViewingSelf && (
              <div>
                {friendshipStatus === 'none' && (
                  <Button
                    onClick={() => {
                      void handleFriendAction();
                    }}
                    disabled={isLoading}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Friend
                  </Button>
                )}
                {friendshipStatus === 'pending_sent' && (
                  <Button variant="outline" disabled>
                    <Clock className="mr-2 h-4 w-4" />
                    Request Pending
                  </Button>
                )}
                {friendshipStatus === 'pending_received' && (
                  <Button variant="secondary">
                    <Clock className="mr-2 h-4 w-4" />
                    Accept Request
                  </Button>
                )}
                {friendshipStatus === 'friends' && (
                  <Button variant="outline" disabled>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Friends
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {(data.user.city ?? data.user.country) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <Text>{[data.user.city, data.user.country].filter(Boolean).join(', ')}</Text>
              </div>
            )}
            <Text className="text-muted-foreground">Member since {memberSince}</Text>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="events">Events ({data.events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="bg-card rounded-lg border p-6 space-y-4">
            {data.user.bio ? (
              <div>
                <Heading level={4} className="mb-2">
                  About
                </Heading>
                <Text>{data.user.bio}</Text>
              </div>
            ) : (
              <Text className="text-muted-foreground">This user hasn't added a bio yet.</Text>
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          {data.events.length === 0 ? (
            <div className="bg-card rounded-lg border p-6 text-center">
              <Text className="text-muted-foreground">No public events hosted yet.</Text>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.events.map((event) => (
                <PublicEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PublicEventCard({ event }: { event: ResUserPublicEvents[number] }) {
  const eventDate = format(new Date(event.startAt), 'MMM d, yyyy');
  const eventTime = format(new Date(event.startAt), 'h:mm a');

  const locationText = event.location
    ? [event.location.name, event.location.city, event.location.country].filter(Boolean).join(', ')
    : 'Location TBD';

  const imageUrl = getEventImageUrl({ id: event.id, title: event.title, imageKey: event.imageKey });

  return (
    <a href={`/events/${event.slug}`} className="block">
      <div className="bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
        <div className="h-40 overflow-hidden">
          <img src={imageUrl} alt={event.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-4 space-y-2">
          <Heading level={4} className="line-clamp-1">
            {event.title}
          </Heading>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Text>{eventDate}</Text>
            <Text>•</Text>
            <Text>{eventTime}</Text>
          </div>
          <Text className="text-sm text-muted-foreground line-clamp-1">{locationText}</Text>
        </div>
      </div>
    </a>
  );
}
