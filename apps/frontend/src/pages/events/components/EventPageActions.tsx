import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/typography';
import { UserAvatar } from '@/components/ui/user-avatar';
import { FaFacebook, FaTelegram, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import type { ResFriendBase } from '@grit/schema';

interface EventPageActionsProps {
  isAttending: boolean | null;
  isLoading: boolean;
  shareOpen: boolean;
  inviteOpen: boolean;
  invitableFriends: ResFriendBase[];
  sentInvites: Set<number>;
  invitingIds: Set<number>;
  eventAttendees?: { id: number }[];
  invitesLoading?: boolean;
  canInvite?: boolean;
  onInviteOpenChange: (open: boolean) => void;
  onShareOpenChange: (open: boolean) => void;
  onInviteFriend: (friendId: number) => Promise<void>;
  onGoing: () => void;
  onInvite: () => void;
  onShare: () => void;
  onChat: () => void;
  onCopyLink: () => void;
  shareText: string;
  shareUrl: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  copied: boolean;
}

export const EventPageActions = ({
  isAttending,
  isLoading,
  shareOpen,
  inviteOpen,
  sentInvites,
  eventAttendees = [],
  invitesLoading,
  canInvite,
  onShareOpenChange,
  onInviteOpenChange,
  onGoing,
  onInvite,
  onShare,
  onChat,
  onCopyLink,
  onInviteFriend,
  invitableFriends,
  invitingIds,
  shareText,
  shareUrl,
  eventTitle,
  eventDate,
  eventLocation,
  copied,
}: EventPageActionsProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Only filter when there's a search query, otherwise show all loaded friends
  const friendsToShow = searchQuery
    ? invitableFriends.filter((friendship) =>
        friendship.friend.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : invitableFriends;

  const isSearching = searchQuery.trim().length > 0;

  // For each friend, determine their status
  const getFriendStatus = (friendId: number) => {
    if (eventAttendees.some((a) => a.id === friendId)) return 'ATTENDING';
    if (sentInvites.has(friendId)) return 'INVITED';
    if (invitingIds.has(friendId)) return 'SENDING';
    return 'NOT_INVITED';
  };

  return (
    <>
      <Card className="w-full border-0 bg-transparent shadow-none md:border md:bg-card md:shadow md:mt-5">
        <CardHeader className="hidden md:block">
          <CardTitle className="flex uppercase items-center text-xl gap-2">
            <span className="font-semibold">&gt;</span>
            <Text className="text-xl font-heading">Menu</Text>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row justify-between items-center pt-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-16 w-full">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => {
                onGoing();
              }}
              disabled={isLoading}
            >
              {isAttending ? 'Going ✓' : 'Going'}
            </Button>
            <Button
              onClick={onInvite}
              disabled={!canInvite || isLoading}
              variant="secondary"
              className="flex-1"
              title={!canInvite ? 'Only event owner can invite to private events' : ''}
            >
              Invite
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onShare}>
              Share
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onChat}>
              Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={shareOpen} onOpenChange={onShareOpenChange}>
        <DialogContent className="max-w-sm flex flex-col gap-2 p-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[12px] uppercase tracking-[0.3em] opacity-50 font-sans font-bold mb-4">
              Share this event
            </DialogTitle>

            <div className="flex flex-col gap-1 mb-4">
              {/* Title: Space Grotesk, tight tracking, extra bold */}
              <Text className="text-3xl font-heading font-black uppercase leading-[0.9] tracking-tighter">
                {eventTitle}
              </Text>

              {/* Metadata: Inter font, bold, spaced out */}
              <div className="flex flex-col gap-0.5 mt-2 opacity-80">
                <Text className="text-[15px] font-sans font-bold uppercase tracking-[0.15em]">
                  {eventDate}
                </Text>
                <Text className="text-[15px] font-sans font-bold uppercase tracking-[0.15em] truncate">
                  {eventLocation}
                </Text>
              </div>
            </div>

            <DialogDescription className="sr-only">
              Scan the QR code or choose a social platform to invite your friends to an event.
            </DialogDescription>
          </DialogHeader>

          {/* QR CODE */}
          <div className="mx-auto w-48 p-1 bg-white border-2 border-black shadow-grit">
            <QRCodeSVG
              value={shareUrl}
              size={180}
              level="H" // High error correction allows for a logo in the center
              marginSize={4}
              imageSettings={{
                src: '/favicon-32x32.png',
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          {/* COPY LINK BUTTON */}
          <Button
            onClick={onCopyLink}
            variant="default"
            className={cn(
              'w-full uppercase font-bold transition-all',
              copied ? 'bg-green-600 hover:bg-green-600' : ''
            )}
          >
            {copied ? 'Copied!' : 'Copy link'}
          </Button>

          {/* SOCIAL GRID */}
          <div className="grid grid-cols-2 gap-2 p-1 mt-2">
            {[
              {
                icon: <FaWhatsapp />,
                label: 'WhatsApp',
                href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
              },
              {
                icon: <FaTelegram />,
                label: 'Telegram',
                href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
              },
              {
                icon: <FaFacebook />,
                label: 'Facebook',
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
              },
              {
                icon: <FaXTwitter />,
                label: 'X (Twitter)',
                href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
              },
            ].map(({ icon, label, href }) => (
              <Button
                key={label}
                asChild
                variant="secondary"
                className="h-auto p-5 flex flex-col items-center justify-center gap-2 [&_svg]:w-7 [&_svg]:h-7"
              >
                <a href={href} target="_blank" rel="noreferrer">
                  <div>{icon}</div>
                  <Text className="text-[10px] font-bold uppercase tracking-widest">{label}</Text>
                </a>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {/* INVITE DIALOG */}
      <Dialog open={inviteOpen} onOpenChange={onInviteOpenChange}>
        <DialogContent className="max-w-sm flex flex-col p-4 max-h-[90vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-[12px] uppercase tracking-[0.3em] opacity-50 font-sans font-bold">
              Invite friends
            </DialogTitle>
            <DialogDescription className="sr-only">
              Search and invite your friends to this event.
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="text-sm flex-shrink-0"
          />

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
            {friendsToShow.length === 0 ? (
              <div className="text-center py-8 text-sm opacity-50">
                {isSearching ? 'No friends match your search' : 'No friends'}
              </div>
            ) : (
              friendsToShow.map((friendship) => {
                const status = getFriendStatus(friendship.friend.id);
                const isDisabled = status !== 'NOT_INVITED';

                return (
                  <div
                    key={friendship.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded border border-border hover:bg-accent transition-colors',
                      isDisabled && 'opacity-60 bg-muted'
                    )}
                  >
                    <UserAvatar user={friendship.friend} size="sm" />
                    <Text className="font-medium flex-1">{friendship.friend.name}</Text>
                    <Button
                      size="sm"
                      disabled={isDisabled}
                      variant={isDisabled ? 'outline' : 'default'}
                      onClick={() => void onInviteFriend(friendship.friend.id)}
                    >
                      {status === 'ATTENDING' && 'Already Going ✓'}
                      {status === 'INVITED' && 'Invited ✓'}
                      {status === 'SENDING' && 'Sending...'}
                      {status === 'NOT_INVITED' && (invitesLoading ? 'Loading...' : 'Invite')}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
