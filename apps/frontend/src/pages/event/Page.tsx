import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heading, Text } from '@/components/ui/typography';
import { Chat } from '@/features/chat/Chat';
import { getEventImageUrl } from '@/lib/image_utils';
import { eventService } from '@/services/eventService';
import { userService } from '@/services/userService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { CurrentUser } from '@/types/user';
import { Calendar, MapPinIcon, Pencil, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const eventLoader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) throw new Response('Not Found', { status: 404 });
  const event = await eventService.getEvent(params.id);
  return event;
};

export const Event = () => {
  const event = useLoaderData<typeof eventLoader>();
  const currentUser: CurrentUser | null = useCurrentUserStore((s) => s.user);
  const currentUserAttending =
    currentUser && event.attending.some((el) => el.id === currentUser.id);
  const isAuthor = event.authorId === currentUser?.id;

  const [isAttending, setIsAttending] = useState(currentUserAttending);
  const [countAttending, setCountAttending] = useState(event.attending.length);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const formattedDate = new Date(event.startAt).toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const location = event.location;
  const cityPostal = [location?.postalCode, location?.city].filter(Boolean);
  const locationPostal = cityPostal.length > 0 ? cityPostal.join(' ') : null;
  const locationParts = [location?.name, location?.address, locationPostal].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : 'TBA';

  //Check if user is attending
  useEffect(() => {
    if (currentUser) {
      setIsAttending(event.attending.some((el) => el.id === currentUser.id));
    }
  }, [event.attending, currentUser]);

  const handleGoing = async (e: React.MouseEvent) => {
    e.preventDefault(); //Prevent Link navigation

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

  return (
    <>
      <Container>
        <div className="flex flex-col justify-between gap-6">
          <Heading level={1}>{event.title}</Heading>

          <div className="flex-1 flex-row gap-4">
            {/* Event details */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {/* Date */}
                <div className="flex flex-row gap-2 items-center">
                  <Calendar className="h-4 w-4 text-primary" />
                  <Text>{formattedDate}</Text>
                </div>
                {/* Location */}
                <div className="flex flex-row gap-2 items-center">
                  <MapPinIcon className="h-4 w-4 text-primary" />
                  <Text>{locationText}</Text>
                </div>
                {/* Attendees */}
                <div className="flex flex-row gap-2 items-center">
                  <User className="h-4 w-4 text-primary" />
                  <Text>{event.attending.length}</Text>
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex flex-row justify-between">
                <div className="flex items-center gap-2 w-/50">
                  <Button variant="outline" className="flex-1">
                    Invite
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      void handleGoing(e);
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
              <div className="flex flex-col gap-4">
                {event.content && (
                  <>
                    <Separator />
                    <Heading level={2}>About</Heading>
                    <Text>{event.content}</Text>
                  </>
                )}
              </div>
            </div>
            <img src={getEventImageUrl(event)} className="w-full aspect-square object-cover" />
          </div>
        </div>
        {currentUserAttending && <Chat event={event} />}
      </Container>
    </>
  );
};
