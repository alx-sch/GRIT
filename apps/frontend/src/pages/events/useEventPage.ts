import { formatEventDateTimeStack } from '@/lib/time_utils';
import { useEventActions } from '@/pages/my-events/hooks/useEventActions';
import { eventService } from '@/services/eventService';
import { friendService } from '@/services/friendService';
import { inviteService } from '@/services/inviteService';
import { userService } from '@/services/userService';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { CurrentUser } from '@/types/user';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { eventLoader } from './EventPage';
import type { ResFriendBase } from '@grit/schema';

export const useEventPage = () => {
  const event = useLoaderData<typeof eventLoader>();
  const currentUser: CurrentUser | null = useCurrentUserStore((s) => s.user);
  const currentUserAttending =
    currentUser && event.attendees.some((el) => el.id === currentUser.id);
  const isAuthor = event.authorId === currentUser?.id;
  const isAdmin = currentUser?.isAdmin ?? false;
  const canEdit = isAuthor || isAdmin;

  const [isAttending, setIsAttending] = useState(currentUserAttending);
  const [countAttending, setCountAttending] = useState(event.attendees.length);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [invitingIds, setInvitingIds] = useState<Set<number>>(new Set());
  const [sentInvites, setSentInvites] = useState<Set<number>>(new Set());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [isInviteCheckLoading, setIsInviteCheckLoading] = useState(true);
  const { acceptInvite, declineInvite } = useEventActions();

  const navigate = useNavigate();

  const { dateLine, timeLine } = formatEventDateTimeStack(event.startAt, event.endAt);

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
  const [invitableFriends, setInvitableFriends] = useState<ResFriendBase[]>([]);

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
    if (!currentUser) {
      void navigate('/login?redirect=' + encodeURIComponent(`/events/${String(event.id)}`));
      return;
    }
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
        toast.info('You are no longer attending "' + event.title + '"!');
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
      toast.success('Event deleted successfully!');
      void navigate('/events', { replace: true });
    } catch (error) {
      toast.error('Failed to delete event: ' + String(error));
    }
  };

  const handleInviteFriend = async (friendId: number) => {
    try {
      setInvitingIds((prev) => new Set(prev).add(friendId));

      await inviteService.sendInvite({
        eventId: event.id,
        receiverId: friendId,
      });

      setSentInvites((prev) => new Set(prev).add(friendId));
      toast.success('Invite sent!');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string })?.message;
        if (typeof message === 'string') {
          toast.error(message);
        } else {
          toast.error('Failed to send invite');
        }
      } else {
        toast.error('Failed to send invite');
      }
    } finally {
      setInvitingIds((prev) => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  const handleInvite = () => {
    if (!currentUser) {
      void navigate('/login?redirect=' + encodeURIComponent(`/events/${String(event.id)}`));
      return;
    }
    setInviteOpen(true);
  };

  const handleAcceptInvite = async (): Promise<boolean> => {
    if (!inviteId) return false;
    const success = await acceptInvite(inviteId);
    if (success) {
      setIsInvited(false);
      setInviteId(null);
      setIsAttending(true);
      setCountAttending((prev) => prev + 1);
    }
    return success;
  };

  const handleDeclineInvite = async (): Promise<boolean> => {
    if (!inviteId) return false;
    const success = await declineInvite(inviteId);
    if (success) {
      setIsInvited(false);
      setInviteId(null);
    }
    return success;
  };

  // Fetch all friends at once (load all pages)
  useEffect(() => {
    const fetchAllFriends = async () => {
      if (!currentUser) return;

      try {
        const allFriends: ResFriendBase[] = [];
        let cursor: string | null = null;
        let hasMore = true;

        // Paginate through all friends
        while (hasMore) {
          const response = await friendService.listFriends({
            limit: '50',
            ...(cursor && { cursor }),
          });
          allFriends.push(...response.data);
          cursor = response.pagination.nextCursor;
          hasMore = response.pagination.hasMore;
        }

        setInvitableFriends(allFriends);
      } catch (error) {
        console.error('Failed to fetch friends', error);
        toast.error('Failed to load friends');
      }
    };

    void fetchAllFriends();
  }, [currentUser?.id]);

  // Fetch which friends have already been invited to this event
  useEffect(() => {
    const fetchOutgoingInvites = async () => {
      try {
        setInvitesLoading(true);
        const { data: invites } = await inviteService.listOutgoingInvites(event.id);
        const sentFriendIds = new Set(invites.map((invite) => invite.receiverId));
        setSentInvites(sentFriendIds);
      } catch (error) {
        console.error('Failed to fetch invites', error);
      } finally {
        setInvitesLoading(false);
      }
    };

    if (currentUser) {
      void fetchOutgoingInvites();
    }
  }, [currentUser?.id, event.id]);

  // Fetch incoming invites to check if user is invited to this event
  useEffect(() => {
    const fetchInvites = async () => {
      if (!currentUser) {
        setIsInvited(false);
        setInviteId(null);
        setIsInviteCheckLoading(false);
        return;
      }

      setIsInviteCheckLoading(true);
      try {
        const response = await userService.getMyInvitedEvents();
        const eventInvite = response.find((inv) => inv.id === event.id);

        if (eventInvite?.invite) {
          setIsInvited(true);
          setInviteId(eventInvite.invite.id);
        } else {
          setIsInvited(false);
          setInviteId(null);
        }
      } catch (error) {
        console.error('Failed to fetch invites', error);
        setIsInvited(false);
        setInviteId(null);
      } finally {
        setIsInviteCheckLoading(false);
      }
    };

    void fetchInvites();
  }, [currentUser?.id, event.id]);

  return {
    event,
    isAuthor,
    isAdmin,
    canEdit,
    isAttending,
    countAttending,
    isLoading,
    isMapOpen,
    invitesLoading,
    isInviteCheckLoading,
    setIsMapOpen,
    selectedImageIndex,
    setSelectedImageIndex,
    shareOpen,
    inviteOpen,
    setInviteOpen,
    isInvited,
    inviteId,
    handleAcceptInvite,
    handleDeclineInvite,
    invitingIds,
    sentInvites,
    setShareOpen,
    dateLine,
    timeLine,
    location,
    locationText,
    imageFiles,
    otherFiles,
    handlePrev,
    handleNext,
    handleShare,
    handleInvite,
    handleInviteFriend,
    handleCopyLink,
    handleChat,
    handleGoing,
    handleDelete,
    navigate,
    shareText,
    shareUrl,
    copied,
    invitableFriends,
  };
};
