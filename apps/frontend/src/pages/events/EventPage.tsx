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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GmapPreview } from '@/components/ui/gmapPreview';
import { Heading, Text } from '@/components/ui/typography';
import { getEventImageUrl } from '@/lib/image_utils';
import { eventService } from '@/services/eventService';
import { APIProvider } from '@vis.gl/react-google-maps';
import { HomeIcon, Loader2, Pencil, Trash2, User } from 'lucide-react';
import { Link, LoaderFunctionArgs, useNavigate } from 'react-router-dom';
import { EventPageActions } from './components/EventPageActions';
import { EventPageFiles } from './components/EventPageFiles';
import { EventAttendanceDropdown } from './components/EventAttendanceDropdown';
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
    invitesLoading,
    isInviteCheckLoading,
    isMapOpen,
    setIsMapOpen,
    selectedImageIndex,
    setSelectedImageIndex,
    shareOpen,
    setShareOpen,
    dateLine,
    timeLine,
    location,
    locationText,
    imageFiles,
    otherFiles,
    isAuthor,
    inviteOpen,
    setInviteOpen,
    invitingIds,
    sentInvites,
    invitableFriends,
    isInvited,
    inviteId,
    handleAcceptInvite,
    handleDeclineInvite,
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
  const canInvite = event.isPublic || isAuthor;

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

              <div className="flex flex-col items-end md:items-start gap-1">
                <Text className="text-lg font-medium text-right md:text-left leading-tight">
                  {dateLine}
                </Text>

                <Text className="text-sm text-muted-foreground text-right md:text-left leading-tight">
                  {timeLine}
                </Text>
              </div>
            </div>

            {/* Host */}
            <div className="flex flex-col gap-2 order-3 md:order-2 items-start">
              {/* Desktop-only Heading */}
              <Heading level={4} className="uppercase hidden md:block">
                Host
              </Heading>

              {/* Icon and Name wrapper */}
              <div className="flex flex-row items-center md:items-start gap-2">
                <HomeIcon className="h-6 w-6 text-primary md:hidden flex-shrink-0" />

                {event.author ? (
                  <Link
                    to={`/users/${event.author.id}`}
                    className="group min-w-0 max-w-full flex items-center gap-1.5 text-left cursor-pointer"
                  >
                    <Text className="text-lg truncate md:underline decoration-dashed underline-offset-4 group-hover:decoration-solid transition-all">
                      {event.author.name}
                    </Text>
                  </Link>
                ) : (
                  <Text className="text-lg">Unknown</Text>
                )}
              </div>
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

          {/* Action buttons - CONDITIONAL RENDERING */}
          {isInviteCheckLoading ? (
            <Card className="w-full border-0 bg-transparent shadow-none md:border md:bg-card md:shadow md:mt-5">
              <CardHeader className="hidden md:block">
                <CardTitle className="flex uppercase items-center text-xl gap-2">
                  <span className="font-semibold">&gt;</span>
                  <Text className="text-xl font-heading">Menu</Text>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-row justify-center items-center pt-3 py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : isInvited && inviteId ? (
            <Card className="w-full border-0 bg-transparent shadow-none md:border md:bg-card md:shadow md:mt-5">
              <CardHeader className="hidden md:block">
                <CardTitle className="flex uppercase items-center text-xl gap-2">
                  <span className="font-semibold">&gt;</span>
                  <Text className="text-xl font-heading">Menu</Text>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-row justify-between items-center pt-3">
                <EventAttendanceDropdown
                  onAccept={handleAcceptInvite}
                  onDecline={handleDeclineInvite}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          ) : (
            <EventPageActions
              canInvite={canInvite}
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
              invitesLoading={invitesLoading}
              eventAttendees={event.attendees}
              onGoing={() => {
                void handleGoing();
              }}
              onInvite={() => {
                handleInvite();
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
              eventDate={dateLine}
              eventLocation={location?.name ?? 'TBA'}
              shareText={shareText}
              shareUrl={shareUrl}
            />
          )}

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
