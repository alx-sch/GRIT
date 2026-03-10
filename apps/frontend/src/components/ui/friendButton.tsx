import { Button } from '@/components/ui/button';
import type { FriendshipStatus } from '@/types/friends';
import { Clock, UserCheck, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FriendButtonProps {
  friendshipStatus: FriendshipStatus;
  isLoading: boolean;
  onAddFriend: () => void;
  size?: 'default' | 'sm';
  acceptHref?: string;
}

export function FriendButton({
  friendshipStatus,
  isLoading,
  onAddFriend,
  size = 'default',
  acceptHref,
}: FriendButtonProps) {
  const isIconOnly = size === 'sm';

  if (friendshipStatus === 'none') {
    return (
      <Button size={size} disabled={isLoading} onClick={onAddFriend}>
        <UserPlus className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
        {!isIconOnly && 'Add Friend'}
      </Button>
    );
  }

  if (friendshipStatus === 'pending_sent') {
    return (
      <Button variant="outline" size={size} disabled>
        <Clock className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
        {!isIconOnly && 'Request Pending'}
      </Button>
    );
  }

  if (friendshipStatus === 'pending_received') {
    if (acceptHref) {
      return (
        <Button variant="secondary" size={size} asChild>
          <Link to={acceptHref}>
            <Clock className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
            {!isIconOnly && 'Accept Request'}
          </Link>
        </Button>
      );
    }
    return (
      <Button variant="secondary" size={size}>
        <Clock className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
        {!isIconOnly && 'Accept Request'}
      </Button>
    );
  }

  if (friendshipStatus === 'friends') {
    return (
      <Button variant="outline" size={size} disabled>
        <UserCheck className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
        {!isIconOnly && 'Friends'}
      </Button>
    );
  }

  return null;
}
