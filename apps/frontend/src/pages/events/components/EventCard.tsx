import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Text } from '@/components/ui/typography';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getEventImageUrl } from '@/lib/image_utils';
import { userService } from '@/services/userService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { EventBase } from '@/types/event';
import type { CurrentUser } from '@/types/user';
import { format } from 'date-fns';
import { User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface EventCardProps {
  event: EventBase;
  friendsIds: Set<number>;
  sentInvites?: Set<number>;
}

export function EventCard({ event, friendsIds, sentInvites = new Set() }: EventCardProps) {
  const [isAttending, setIsAttending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentUser: CurrentUser | null = useCurrentUserStore((s) => s.user);
  const navigate = useNavigate();
  const [countAttending, setCountAttending] = useState(event.attendees.length);
  const friendsGoing = event.attendees.filter((a) => friendsIds.has(a.id));

  //Check if user is attending
  useEffect(() => {
    if (currentUser) {
      setIsAttending(event.attendees.some((el) => el.id === currentUser.id));
    } else {
      setIsAttending(false);
    }
  }, [event.attendees, currentUser]);

  const handleGoing = async (e: React.MouseEvent) => {
    e.preventDefault(); //Prevent Link navigation

    if (!currentUser) {
      void navigate('/login?redirect=' + encodeURIComponent(`/events/${event.slug}`));
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

  const handleInvite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      void navigate('/login?redirect=' + encodeURIComponent(`/events/${event.slug}`));
      return;
    }
    void navigate(`/events/${event.slug}`);
  };

  return (
    <Link to={event.slug}>
      <Card className="w-full h-full flex flex-col rounded border-3 mx-auto hover:-translate-y-1 transition-transform duration-200 max-w-100">
        <CardHeader>
          <img
            src={getEventImageUrl(event)}
            alt={event.title}
            className="w-full aspect-square object-cover"
          />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 space-y-3 overflow-hidden">
          <CardTitle className="font-bold text-3xl line-clamp-2" title={event.title}>
            {event.title}
          </CardTitle>
          <CardDescription
            className="font-heading font-medium text-xl line-clamp-2 min-w-0"
            title={`${format(event.startAt, 'EEE, MMM d')} @ ${event.location?.name ?? 'TBA'}`}
          >
            {format(event.startAt, 'EEE, MMM d')} @ {event.location?.name ?? 'TBA'}
          </CardDescription>
          <div className="flex items-center gap-2 text-base font-normal text-muted-foreground">
            <User className="h-5 w-5 text-primary" strokeWidth={2} />
            <Text>{countAttending > 0 ? countAttending.toLocaleString() : 'Be the first'}</Text>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 pb-2 gap-2 mt-auto flex flex-col">
          {/*Friends interested section*/}
          <div className="flex items-center gap-2 w-full pb-2">
            {friendsGoing && friendsGoing.length > 0 && (
              <div className="flex -space-x-3">
                {friendsGoing.slice(0, 3).map((friend, index) => (
                  <UserAvatar
                    user={friend}
                    size="sm"
                    className="border-2 border-background bg-muted"
                    key={index}
                  />
                ))}
              </div>
            )}
            <Text className="text-muted-foreground">
              {friendsGoing && friendsGoing.length > 0 && friendsGoing.length < 2 && `  is going`}
              {friendsGoing && friendsGoing.length > 1 && friendsGoing.length < 4 && `  are going`}
              {friendsGoing &&
                friendsGoing.length > 3 &&
                ` + ${(friendsGoing.length - 3).toLocaleString()} friends are going`}
            </Text>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full">
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
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
