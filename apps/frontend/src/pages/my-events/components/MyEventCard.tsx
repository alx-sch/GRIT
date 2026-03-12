import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/typography';
import { getEventImageUrl } from '@/lib/image_utils';
import type { ResMyEvents, ResMyInvitedEvents } from '@grit/schema';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEventBadges } from '../utils/eventBadges';
import { LocationButton } from './LocationButton';

type ResMyEvent = ResMyEvents[number];
type ResMyInvitedEvent = ResMyInvitedEvents[number];
type EventType = ResMyEvent | ResMyInvitedEvent;

interface MyEventCardProps {
  event: EventType;
  optimisticState?: { isPublished?: boolean; isPublic?: boolean };
  onPublish?: (eventId: number, eventSlug: string) => Promise<boolean>;
  onUnpublish?: (eventId: number) => Promise<boolean>;
  onEdit?: (eventSlug: string) => void;
  onViewDetails: (eventSlug: string) => void;
}

export function MyEventCard({
  event,
  optimisticState,
  onPublish,
  onUnpublish,
  onEdit,
  onViewDetails,
}: MyEventCardProps) {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isPublished = optimisticState?.isPublished ?? event.isPublished;
  const isPublic = optimisticState?.isPublic ?? event.isPublic;
  const isDraft = event.isOrganizer && !isPublished;

  const badges = getEventBadges(event, isPublished, isPublic, !onEdit && !event.isOrganizer);

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handlePublishConfirm = async () => {
    setIsLoading(true);
    await onPublish?.(event.id, event.slug);
    setIsLoading(false);
    setPublishDialogOpen(false);
  };

  const handleUnpublishConfirm = async () => {
    setIsLoading(true);
    await onUnpublish?.(event.id);
    setIsLoading(false);
    setUnpublishDialogOpen(false);
  };

  return (
    <>
      <Card
        onClick={() => {
          onViewDetails(event.slug);
        }}
        className={cn(
          'hover:shadow-md transition-shadow overflow-hidden cursor-pointer',
          isDraft && 'border-dashed border-red-500/40',
          !isPublic && !isDraft && 'border-dashed border-orange-500/40'
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-stretch min-w-0">
            <div className="w-full md:w-40 md:h-40 shrink-0 p-4 md:p-3">
              <img
                src={getEventImageUrl(event)}
                alt={event.title}
                className="w-full h-full aspect-square object-cover rounded mx-auto"
              />
            </div>

            <div className="flex-1 min-w-0 p-4 md:p-6 flex flex-col md:flex-row md:gap-4 overflow-hidden">
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {badges.map((badge) => (
                    <Badge key={badge.label} variant={badge.variant} className="shrink-0">
                      {badge.icon}
                      {badge.label}
                    </Badge>
                  ))}
                </div>

                <Text className="font-semibold text-lg break-words mb-3">{event.title}</Text>

                <Text className="text-sm text-muted-foreground mb-2 truncate">
                  {formatEventDate(event.startAt)}
                </Text>

                <div className="min-w-0 overflow-hidden">
                  <LocationButton location={event.location} />
                </div>
              </div>

              <div
                className="flex flex-row md:flex-col gap-2 mt-4 md:mt-0 md:shrink-0 md:self-center"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {isDraft && onPublish && (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 md:flex-none md:w-auto md:min-w-35"
                    onClick={() => {
                      setPublishDialogOpen(true);
                    }}
                  >
                    Publish
                  </Button>
                )}

                {event.isOrganizer && isPublished && onUnpublish && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 md:flex-none md:w-auto md:min-w-35"
                    onClick={() => {
                      setUnpublishDialogOpen(true);
                    }}
                  >
                    Unpublish
                  </Button>
                )}
                {event.isOrganizer && onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none md:w-auto md:min-w-35"
                    onClick={() => {
                      onEdit(event.slug);
                    }}
                    title="Edit event"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    <span>Edit</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {onPublish && (
        <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Publish Event?</AlertDialogTitle>
              <AlertDialogDescription>
                This will make your event visible to everyone. Attendees will be able to see and
                join the event.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void handlePublishConfirm();
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Publishing...' : 'Publish'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {onUnpublish && (
        <AlertDialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unpublish Event?</AlertDialogTitle>
              <AlertDialogDescription>
                This will hide your event from the public. Existing attendees will still see it in
                their events list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void handleUnpublishConfirm();
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Unpublishing...' : 'Unpublish'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
