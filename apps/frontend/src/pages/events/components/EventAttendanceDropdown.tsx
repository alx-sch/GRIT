import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, X } from 'lucide-react';

interface EventAttendanceDropdownProps {
  onAccept: () => Promise<boolean>;
  onDecline: () => Promise<boolean>;
  isLoading?: boolean;
}

export function EventAttendanceDropdown({
  onAccept,
  onDecline,
  isLoading = false,
}: EventAttendanceDropdownProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    setIsSubmitting(true);
    const success = await onAccept();
    setIsSubmitting(false);
    if (success) setOpen(false);
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    const success = await onDecline();
    setIsSubmitting(false);
    if (success) setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="default" disabled={isLoading || isSubmitting}>
          Respond to Invite
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => void handleAccept()}
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          <Check className="w-4 h-4 mr-2 text-green-600" />
          <span>Accept</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void handleDecline()}
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          <X className="w-4 h-4 mr-2 text-red-600" />
          <span>Decline</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
