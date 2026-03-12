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
import { BackButton } from '@/components/ui/backButton';
import { Button } from '@/components/ui/button';
import { GmapPreview } from '@/components/ui/gmapPreview';
import { Heading, Text } from '@/components/ui/typography';
import { getEventImageUrl } from '@/lib/image_utils';
import { eventService } from '@/services/eventService';
import { APIProvider } from '@vis.gl/react-google-maps';
import { HomeIcon, Pencil, Trash2, User } from 'lucide-react';
import { Link, LoaderFunctionArgs, useNavigate } from 'react-router-dom';
import { EventPageActions } from './components/EventPageActions';
import { EventPageFiles } from './components/EventPageFiles';
import { useEventPage } from './useEventPage';

export const eventLoader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) throw new Response('Not Found', { status: 404 });
  const event = await eventService.getEvent(params.id);
  return event;
};

export const EventPage = () => {
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API as string;

  const {
    event,
    canEdit,
    isAttending,
    countAttending,
    isLoading,
    isMapOpen,
    setIsMapOpen,
    selectedImageIndex,
    setSelectedImageIndex,
    shareOpen,
    setShareOpen,
    formattedDate,
    location,
    locationText,
    imageFiles,
    otherFiles,
    inviteOpen,
    setInviteOpen,
    invitingIds,
    sentInvites,
    invitableFriends,
    handlePrev,
    handleNext,
    handleShare,
    handleCopyLink,
    handleChat,
    handleInvite,
    handleInviteFriend,
    handleGoing,
    handleDelete,
    shareText,
    shareUrl,
    copied,
  } = useEventPage();

  const addressCity = [location?.address, location?.city]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s))
    .join(', ');

  const country = location?.country?.trim() ?? '';

  const locationLabel = addressCity !== '' ? addressCity : country !== '' ? country : 'TBA';

  // Added a handler here because of back button bug (it needed to be clicked two times to go back to /events).
  const handleBackClick = () => {
    void navigate('/events');
  };

  return (
    <div className="space-y-8">
      <BackButton onClick={handleBackClick} />
      <div className="flex flex-row justify-between">
        <div className="space-y-2">
          <Heading level={1} className="text-3xl md:text-4xl">
            {event.title}
          </Heading>
        </div>
        <div className="flex flex-row gap-2">
          {canEdit && (
            <Link to="edit">
              <Button variant="secondary" size="lg">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {canEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                  <AlertDialogDescription>
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
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-6">
          {/* Info row */}
          <div className="grid grid-cols-2 gap-6 md:gap-4 md:flex md:flex-row md:justify-between">
            {/* Location */}
            <div className="flex flex-col gap-2">
              <Heading level={4} className="uppercase">
                Location
              </Heading>
              {location?.latitude && location?.longitude ? (
                <button
                  onClick={() => {
                    setIsMapOpen(true);
                  }}
                  type="button"
                  className="group flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <Text className="text-lg md:underline decoration-dashed underline-offset-4 group-hover:decoration-solid transition-all">
                    {locationLabel}
                  </Text>
                </button>
              ) : (
                <Text className="text-lg">
                  {location?.name ? (
                    <>
                      <span className="font-semibold underline decoration-1">{location.name}</span>
                      {locationText && ` - ${locationText}`}
                    </>
                  ) : (
                    'TBA'
                  )}
                </Text>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col gap-2 order-2 md:order-3 items-end md:items-start">
              <Heading level={4} className="uppercase">
                Date
              </Heading>
              <Text className="text-lg text-right md:text-left">{formattedDate}</Text>
            </div>

            {/* Host */}
            <div className="flex flex-row md:flex-col gap-2 order-3 md:order-2 items-center md:items-start">
              <HomeIcon className="h-6 w-6 text-primary md:hidden flex-shrink-0" />
              <Heading level={4} className="uppercase hidden md:block">
                Host
              </Heading>
              {event.author && (
                <Link to={`/users/${event.author.id}`} className="min-w-0 max-w-full">
                  <Text className="text-lg hover:underline truncate">{event.author.name}</Text>
                </Link>
              )}
            </div>

            {/* Going */}
            <div className="flex flex-col gap-2 order-4 items-end md:items-start">
              <Heading level={4} className="uppercase hidden md:block">
                Going
              </Heading>
              <div className="flex flex-row gap-2">
                <Text className="text-lg">
                  {countAttending > 0 ? String(countAttending) : 'Be the first'}
                </Text>
                <User className="h-6 w-6 text-primary md:hidden" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <EventPageActions
            isAttending={isAttending}
            isLoading={isLoading}
            invitingIds={invitingIds}
            sentInvites={sentInvites}
            onInviteFriend={handleInviteFriend}
            shareOpen={shareOpen}
            inviteOpen={inviteOpen}
            invitableFriends={invitableFriends}
            onInviteOpenChange={setInviteOpen}
            onShareOpenChange={setShareOpen}
            onGoing={() => {
              void handleGoing();
            }}
            onInvite={() => {
              void handleInvite();
            }}
            onShare={() => {
              handleShare();
            }}
            onChat={handleChat}
            onCopyLink={() => {
              void handleCopyLink();
            }}
            copied={copied}
            eventTitle={event.title}
            eventDate={formattedDate}
            eventLocation={location?.name ?? 'TBA'}
            shareText={shareText}
            shareUrl={shareUrl}
          />

          {/* Event image */}
          {event.imageKey && (
            <div className="-mx-8 md:mx-0 md:h-160">
              <img
                src={getEventImageUrl(event)}
                className="w-full h-full aspect-3/2 object-cover"
              />
            </div>
          )}

          {/* Description */}
          {event.content && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 self-start">
                <span className="font-semibold">&gt;</span>
                <Text className="text-xl font-heading uppercase">Description</Text>
              </div>
              <Text>{event.content}</Text>
            </div>
          )}

          {/* Additional info */}
          {event.files && event.files.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 self-start">
                <span className="font-semibold">&gt;</span>
                <Text className="text-xl font-heading uppercase">Additional info</Text>
              </div>
              <EventPageFiles
                imageFiles={imageFiles}
                otherFiles={otherFiles}
                selectedImageIndex={selectedImageIndex}
                onSelectImage={setSelectedImageIndex}
                onClose={() => {
                  setSelectedImageIndex(null);
                }}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            </div>
          )}
        </div>
      </div>

      {/* Map dialog */}
      <APIProvider apiKey={apiKey}>
        {location?.latitude != null && location?.longitude != null && (
          <GmapPreview
            lat={location.latitude}
            lng={location.longitude}
            open={isMapOpen}
            onOpenChange={setIsMapOpen}
            location={location}
          />
        )}
      </APIProvider>
    </div>
  );
};
