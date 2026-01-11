import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Event } from '@/types/event';
import { formatDate } from '@/lib/utils';
import { generateImagePlaceholderEvent } from '@/lib/imageGenerator';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="w-full flex flex-col rounded border-3 mx-auto hover:-translate-y-1 transition-transform duration-200">
      <CardHeader className="p-4">
        <img
          src={event.imageURL ?? generateImagePlaceholderEvent(event)}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        <CardTitle className="font-heading font-bold text-3xl line-clamp-2" title={event.title}>
          {event.title}
        </CardTitle>
        <CardDescription className="font-heading font-medium text-xl">
          {formatDate(event.startAt)} @ {event.location}
        </CardDescription>
        <p className="text-base font-normal text-muted-foreground">
          {event.interestedCount > 0
            ? `${event.interestedCount.toLocaleString()} people are interested`
            : 'No one is interested yet'}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 pb-2 gap-2 mt-auto flex flex-col">
        {/* Friends interested section */}
        <div className="flex items-center gap-1 w-full pb-2">
          {event.interestedFriends && event.interestedFriends.length > 0 && (
            <div className="flex space-x-0.5">
              {event.interestedFriends.slice(0, 3).map((friend, index) => (
                <Avatar key={index} className="h-8 w-8 border-2 border-black">
                  <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${friend}`} />
                  <AvatarFallback>{friend[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
          <span className="text-base font-normal text-muted-foreground">
            {event.interestedFriends &&
              event.interestedFriends.length > 3 &&
              ` + ${(event.interestedFriends.length - 3).toLocaleString()} friends are interested`}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full">
          <Button variant="default" className="flex-1">
            INVITE
          </Button>
          <Button variant="outline" className="flex-1">
            GOING
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
