import { Container } from '@/components/layout/Container';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { GmapPreview } from '@/components/ui/gmapPreview';
import { Separator } from '@/components/ui/separator';
import { Heading, Text } from '@/components/ui/typography';
import { ChatBox } from '@/features/chat/ChatBox';
import { getEventImageUrl } from '@/lib/image_utils';
import { eventService } from '@/services/eventService';
import { userService } from '@/services/userService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { CurrentUser } from '@/types/user';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Calendar, House, MapPinIcon, Pencil, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const eventLoader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) throw new Response('Not Found', { status: 404 });
  const event = await eventService.getEvent(params.id);
  return event;
};

export const EventPage = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API as string;

  const event = useLoaderData<typeof eventLoader>();
  const currentUser: CurrentUser | null = useCurrentUserStore((s) => s.user);
  const currentUserAttending =
    currentUser && event.attendees.some((el) => el.id === currentUser.id);
  const isAuthor = event.authorId === currentUser?.id;

  const [isAttending, setIsAttending] = useState(currentUserAttending);
  const [countAttending, setCountAttending] = useState(event.attendees.length);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const navigate = useNavigate();

  const formattedDate = new Date(event.startAt).toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const location = event.location;
  const cityPostal = [location?.postalCode, location?.city].map((s) => s?.trim()).filter(Boolean);
  const locationPostal = cityPostal.length > 0 ? cityPostal.join(' ') : null;
  const locationParts = [location?.address, locationPostal].map((s) => s?.trim()).filter(Boolean);
  const locationText =
    locationParts.length > 0
      ? locationParts.length > 1
        ? locationParts.join(', ')
        : locationParts[0]
      : '';

  //Check if user is attending
  useEffect(() => {
    if (currentUser) {
      setIsAttending(event.attendees.some((el) => el.id === currentUser.id));
    }
  }, [event.attendees, currentUser]);

  const handleGoing = async () => {
    if (!currentUser) {
      void navigate('/login?redirect=' + encodeURIComponent(`/events/${String(event.id)}`));
      return;
    }
    setIsLoading(true);
    if (isAttending) {
      try {
        await userService.unattendEvent(event.id);
        setIsAttending(false);
        setCountAttending((prev) => prev - 1);
        toast.info('You are no longer attending "' + event.title + '".');
      } catch (error) {
        toast.error('Something went wrong:' + String(error));
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        await userService.attendEvent(event.id);
        setIsAttending(true);
        setCountAttending((prev) => prev + 1);
        toast.info('You’re going to "' + event.title + '".');
      } catch (error) {
        toast.error('Something went wrong:' + String(error));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    try {
      await eventService.deleteEvent(String(event.id));
      toast.success('Event Deleted');
      void navigate('/events', { replace: true });
    } catch (error) {
      toast.error('Failed to delete events: ' + String(error));
    }
  };

  return (
    <>
      <Container className="py-10 space-y-8 p-0 md:px-0">
        <div className="flex flex-row justify-between">
          <div className="space-y-2">
            <Heading level={1} className="text-3xl md:text-4xl">
              {event.title}
            </Heading>
          </div>
          {isAuthor && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {' '}
                    This action cannot be undone. This will permanently delete "{event.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      void handleDelete();
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Event details */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              {/* Date */}
              <div className="flex flex-row gap-2 items-center">
                <Calendar className="h-6 w-6 text-primary" />
                <Text className="text-lg">{formattedDate}</Text>
              </div>
              {/* Location */}
              <div className="flex flex-row gap-2 items-center">
                <MapPinIcon className="h-6 w-6 text-primary" />
                {location?.latitude && location?.longitude ? (
                  <button
                    onClick={() => {
                      setIsMapOpen(true);
                    }}
                    type="button"
                  >
                    <Text className="text-lg">
                      {location?.name && (
                        <span className="font-semibold underline decoration-1">
                          {location.name}
                        </span>
                      )}
                    </Text>
                  </button>
                ) : (
                  <Text className="text-lg">
                    {location?.name ? (
                      <>
                        <span className="font-semibold underline decoration-1">
                          {location.name}
                        </span>
                        {locationText && ` - ${locationText}`}
                      </>
                    ) : (
                      'TBA'
                    )}
                  </Text>
                )}
              </div>
              {/* Author */}
              <div className="flex flex-row gap-2 items-center">
                {event.author?.name && (
                  <>
                    <House className="h-6 w-6 text-primary" />
                    <Text className="text-lg">
                      <span>Host: </span>
                      <span className="font-semibold">{event.author.name}</span>
                    </Text>
                  </>
                )}
              </div>
              {/* Attendees */}
              <div className="flex flex-row gap-2 items-center">
                <User className="h-6 w-6 text-primary" />
                <Text className="text-lg">{countAttending}</Text>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-row justify-between">
              <div className="flex items-center gap-2 w-/50">
                <Button variant="secondary" className="flex-1">
                  Invite
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    void handleGoing();
                  }}
                  disabled={isLoading}
                >
                  {isAttending ? 'Going ✓' : 'Going'}
                </Button>
                {isAuthor && (
                  <Button variant="ghost" asChild>
                    <Link to="edit">
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            {/* Description */}
            <div className="flex flex-col gap-4">
              {event.content && (
                <>
                  <Separator className="shrink-0 dark:bg-white/20" />
                  <Heading level={2}>About</Heading>
                  <Text>{event.content}</Text>
                </>
              )}
            </div>
          </div>
          {getEventImageUrl(event) && (
            <div className="flex-1 max-w-md flex-col">
              <img
                src={getEventImageUrl(event)}
                className="w-full aspect-square object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {event.conversation?.id && isAttending && (
          <>
            <Separator className="shrink-0 dark:bg-white/20" />
            <ChatBox conversationId={event.conversation?.id} />
          </>
        )}
      </Container>
      <APIProvider apiKey={apiKey}>
        {location?.latitude != null && location?.longitude != null && (
          <GmapPreview
            lat={location?.latitude}
            lng={location?.longitude}
            open={isMapOpen}
            onOpenChange={setIsMapOpen}
            location={location}
          />
        )}
      </APIProvider>
    </>
  );
};
