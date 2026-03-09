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
import { FaFacebook, FaTelegram, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface EventPageActionsProps {
  isAttending: boolean | null;
  isLoading: boolean;
  shareOpen: boolean;
  onShareOpenChange: (open: boolean) => void;
  onGoing: () => void;
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
  onShareOpenChange,
  onGoing,
  onShare,
  onChat,
  onCopyLink,
  shareText,
  shareUrl,
  eventTitle,
  eventDate,
  eventLocation,
  copied,
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
          <div className="mx-auto w-48 p-2 bg-white border-2 border-black shadow-grit">
            <QRCodeSVG
              value={shareUrl}
              size={180}
              level="H" // High error correction allows for a logo in the center
              marginSize={4}
              imageSettings={{
                src: '/GRIT-logo.png', // USE REAL LOGO, fine to be just 400 x 400 px
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
                icon: <FaWhatsapp size={28} />,
                label: 'WhatsApp',
                href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
              },
              {
                icon: <FaTelegram size={28} />,
                label: 'Telegram',
                href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
              },
              {
                icon: <FaFacebook size={28} />,
                label: 'Facebook',
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
              },
              {
                icon: <FaXTwitter size={28} />,
                label: 'X (Twitter)',
                href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
              },
            ].map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-5 gap-2 rounded-2xl border bg-muted hover:bg-accent hover:border-accent transition-colors group text-center"
              >
                <div className="flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                  {icon}
                </div>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground">
                  {label}
                </Text>
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
