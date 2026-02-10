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
import { getEventImageUrl } from '@/lib/image_utils';
import { userService } from '@/services/userService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { EventBase } from '@/types/event';
import { LocationBase } from '@/types/location';
import type { CurrentUser } from '@/types/user';
import { format } from 'date-fns';
import { User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface EventCardProps {
  event: EventBase;
  location?: LocationBase;
}

export function EventCard({ event, location }: EventCardProps) {
  const [isAttending, setIsAttending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentUser: CurrentUser | null = useCurrentUserStore((s) => s.user);
  const navigate = useNavigate();
  const [countAttending, setCountAttending] = useState(event.attending.length);

  //Check if user is attending
  useEffect(() => {
    if (currentUser) {
      setIsAttending(event.attending.some((el) => el.id === currentUser.id));
    }
  }, [event.attending, currentUser]);

  const handleGoing = async (e: React.MouseEvent) => {
    e.preventDefault(); //Prevent Link navigation

    console.log('user:', currentUser);
    if (!currentUser) {
      navigate('/login?redirect=' + encodeURIComponent(`/events/${event.id}`));
      return;
    }
    setIsLoading(true);
    try {
      await userService.attendEvent(event.id);
      setIsAttending(true);
	  setCountAttending(prev => prev + 1);
    } catch (error) {
      toast.error('Something went wrong:' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link to={event.id.toString()}>
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
            title={`${format(event.startAt, 'EEE, MMM d')} @ ${location?.name ?? 'TBA'}`}
          >
            {format(event.startAt, 'EEE, MMM d')} @ {location?.name ?? 'TBA'}
          </CardDescription>
          <div className="flex items-center gap-2 text-base font-normal text-muted-foreground">
            <User className="h-5 w-5 text-primary" strokeWidth={2} />
            <Text>
              {countAttending > 0
                ? countAttending.toLocaleString()
                : 'Be the first'}
            </Text>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 pb-2 gap-2 mt-auto flex flex-col">
          {/* Friends interested section */}
          <div className="flex items-center gap-1 w-full pb-2">
            {/*{event.interestedFriends && event.interestedFriends.length > 0 && (
            <div className="flex -space-x-3">
            {event.interestedFriends.slice(0, 3).map((friend, index) => (
              <Avatar
              key={index}
              className="h-8 w-8 border-2 border-background bg-muted"
              style={{ zIndex: 3 - index }}
              >
              <AvatarImage seed={friend.name} />

              <AvatarFallback>{friend.name[0]}</AvatarFallback>
              </Avatar>
              ))}
              </div>
              )}
              <Text className="text-muted-foreground">
              {event.interestedFriends &&
              event.interestedFriends.length > 3 &&
              ` + ${(event.interestedFriends.length - 3).toLocaleString()} friends are interested`}
              </Text>*/}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full">
            <Button variant="default" className="flex-1">
              Invite
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGoing}
              disabled={isLoading || isAttending}
            >
              {isAttending ? 'Going ✓' : 'Going'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
