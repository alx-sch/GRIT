import { Button } from '@/components/ui/button';
import type { FriendshipStatus } from '@/types/friends';
import { Clock, UserCheck, UserMinus, UserPlus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FriendButtonProps {
  friendshipStatus: FriendshipStatus;
  isLoading: boolean;
  onAddFriend: () => void;
  onRemoveFriend?: () => void;
  onAcceptRequest?: () => void;
  onCancelRequest?: () => void;
  size?: 'default' | 'sm';
  acceptHref?: string;
}

export function FriendButton({
  friendshipStatus,
  isLoading,
  onAddFriend,
  onRemoveFriend,
  onAcceptRequest,
  onCancelRequest,
  size = 'default',
  acceptHref,
}: FriendButtonProps) {
  const isIconOnly = size === 'sm';
  const widthClass = !isIconOnly ? 'min-w-[200px] justify-start' : '';

  if (friendshipStatus === 'none') {
    return (
      <Button size={size} disabled={isLoading} onClick={onAddFriend} className={widthClass}>
        <UserPlus className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
        {!isIconOnly && 'Add Friend'}
      </Button>
    );
  }

  if (friendshipStatus === 'pending_sent') {
    if (onCancelRequest) {
      return (
        <Button
          variant="outline"
          size={size}
          disabled={isLoading}
          onClick={onCancelRequest}
          className={widthClass}
        >
          <X className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
          {!isIconOnly && 'Cancel Request'}
        </Button>
      );
    }
    return (
      <Button variant="outline" size={size} disabled className={widthClass}>
        <Clock className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
        {!isIconOnly && 'Request Pending'}
      </Button>
    );
  }

  if (friendshipStatus === 'pending_received') {
    if (acceptHref) {
      return (
        <Button variant="secondary" size={size} asChild className={widthClass}>
          <Link to={acceptHref}>
            <Clock className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
            {!isIconOnly && 'Accept Request'}
          </Link>
        </Button>
      );
    }
    if (onAcceptRequest) {
      return (
        <Button
          variant="secondary"
          size={size}
          disabled={isLoading}
          onClick={onAcceptRequest}
          className={widthClass}
        >
          <Clock className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
          {!isIconOnly && 'Accept Request'}
        </Button>
      );
    }
    return (
      <Button variant="secondary" size={size} disabled className={widthClass}>
        <Clock className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
        {!isIconOnly && 'Accept Request'}
      </Button>
    );
  }

  if (friendshipStatus === 'friends') {
    if (onRemoveFriend) {
      return (
        <Button
          variant="destructive"
          size={size}
          disabled={isLoading}
          onClick={onRemoveFriend}
          className={widthClass}
        >
          <UserMinus className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
          {!isIconOnly && 'Unfriend'}
        </Button>
      );
    }
    return (
      <Button variant="outline" size={size} disabled className={widthClass}>
        <UserCheck className={isIconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'} />
        {!isIconOnly && 'Friends'}
      </Button>
    );
  }

  return null;
}
