import { eventService } from '@/services/eventService';
import { userService } from '@/services/userService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { CurrentUser } from '@/types/user';
import { useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';

import type { eventLoader } from './EventPage';

export const useEventPage = () => {
  const event = useLoaderData<typeof eventLoader>();
  const currentUser: CurrentUser | null = useCurrentUserStore((s) => s.user);
  const currentUserAttending =
    currentUser && event.attendees.some((el) => el.id === currentUser.id);
  const isAuthor = event.authorId === currentUser?.id;

  const [isAttending, setIsAttending] = useState(currentUserAttending);
  const [countAttending, setCountAttending] = useState(event.attendees.length);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const formattedDate = format(new Date(event.startAt), 'MMMM d, yyyy | p');

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

  const imageFiles = event.files.filter((f) => f.mimeType.startsWith('image/'));
  const otherFiles = event.files.filter((f) => !f.mimeType.startsWith('image/'));

  const handlePrev = () => {
    setSelectedImageIndex((i) => {
      if (i === null) return null;
      return i > 0 ? i - 1 : imageFiles.length - 1;
    });
  };

  const handleNext = () => {
    setSelectedImageIndex((i) => {
      if (i === null) return null;
      return i < imageFiles.length - 1 ? i + 1 : 0;
    });
  };

  const shareUrl = window.location.href;
  const inviterName = currentUser?.name ?? 'A friend';
  const shareText = `${inviterName} wants to invite you to "${event.title}"! Check it out on GRIT:`;

  const handleShare = () => {
    setShareOpen(true);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    toast.info('Invitation link copied');
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
    // setShareOpen(false);
  };

  const handleChat = () => {
    if (!isAttending) {
      toast.warning('You need to be attending the event to access the chat');
      return;
    }
    void navigate(`/chat/${String(event.conversation?.id)}`);
  };

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
        toast.info('You\u2019re going to "' + event.title + '".');
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

  return {
    event,
    isAuthor,
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
    handlePrev,
    handleNext,
    handleShare,
    handleCopyLink,
    handleChat,
    handleGoing,
    handleDelete,
    navigate,
    shareText,
    shareUrl,
    copied,
  };
};
