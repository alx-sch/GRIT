import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/typography';
import { FaFacebook, FaTelegram, FaWhatsapp, FaXTwitter, FaSlack } from 'react-icons/fa6';

interface EventPageActionsProps {
  isAttending: boolean | null;
  isLoading: boolean;
  shareOpen: boolean;
  onShareOpenChange: (open: boolean) => void;
  onGoing: () => void;
  onShare: () => void;
  onChat: () => void;
  onCopyLink: () => void;
  eventTitle: string;
  shareText: string;
  shareUrl: string;
}

export const EventPageActions = ({
  isAttending,
  isLoading,
  shareOpen,
  onShareOpenChange,
  onGoing,
  onShare,
  onChat,
  onCopyLink,
  eventTitle,
  shareText,
  shareUrl,
}: EventPageActionsProps) => {
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
            <Button variant="secondary" className="flex-1">
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
        <DialogContent className="max-w-sm flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle>Share this event</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3 pt-2">
            {[
              {
                icon: <FaWhatsapp size={34} color="#25D366" />,
                label: 'WhatsApp',
                href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
              },
              {
                icon: <FaTelegram size={34} color="#26A5E4" />,
                label: 'Telegram',
                href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
              },
              {
                // Facebook doesn't support pre-filling text in share dialogs
                icon: <FaFacebook size={34} color="#1877F2" />,
                label: 'Facebook',
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
              },
              {
                icon: <FaXTwitter size={34} color="currentColor" />,
                label: 'X',
                href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
              },
            ].map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                className="flex flex-col items-center p-3 gap-1.5 rounded-xl hover:bg-muted transition-colors"
                rel="noreferrer"
              >
                {icon}
              </a>
            ))}
          </div>
          <Button
            onClick={() => {
              onCopyLink();
            }}
            className="text-sm text-left hover:underline"
            variant="secondary"
          >
            Copy link
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
