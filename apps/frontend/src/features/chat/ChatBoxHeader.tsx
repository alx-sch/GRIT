import { chatStore } from '@/store/chatStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { ResConversationSingle } from '@grit/schema';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { mapConversationToCard } from './conversationToCard';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getEventImageUrl } from '@/lib/image_utils';
import { cn } from '@/lib/utils';

export const ChatBoxHeader = ({ conversation }: { conversation: ResConversationSingle }) => {
  const navigate = useNavigate();

  const currentUser = useCurrentUserStore((s) => s.user);
  const conversationState = chatStore((s) => s.conversations[conversation.id]);

  if (!currentUser) return '';

  const { title } = mapConversationToCard(conversation, conversationState, currentUser);

  const otherUser =
    conversation.type === 'DIRECT'
      ? conversation.participants.find((el) => el.user.id !== currentUser.id)?.user
      : undefined;

  const isDirect = conversation.type === 'DIRECT';
  const isEventChat = conversation.type === 'EVENT';
  const eventSlug = conversation.event?.slug;
  const hasEvent = isEventChat && eventSlug;
  const isValidOtherUser = otherUser && otherUser.id !== null;

  const avatarUser =
    conversation.type === 'DIRECT'
      ? otherUser
      : {
          name:
            conversation.type === 'EVENT'
              ? (conversation.event?.title ?? '')
              : (conversation.title ?? ''),
        };

  const eventSrc =
    conversation.type === 'EVENT' && conversation.event
      ? getEventImageUrl(conversation.event)
      : undefined;

  const avatarEl = (
    <UserAvatar
      user={avatarUser ?? { name: '' }}
      src={eventSrc}
      size="md"
      className={cn('mr-3', isEventChat && 'rounded-[3px]')}
      fallbackClassName={isEventChat ? 'rounded-[3px]' : undefined}
    />
  );

  return (
    <>
      <div className="h-17 overflow-hidden bg-accent text-black mt-1 mb-4 flex items-center">
        <div className="border-r-2 flex items-center">
          <button
            className="h-17 w-15 flex justify-center items-center md:hidden cursor-pointer"
            onClick={() => void navigate('/chat')}
          >
            <ChevronLeft />
          </button>
        </div>
        <div className="py-2 px-2.5 flex">
          {isDirect && isValidOtherUser ? (
            <Link to={`/users/${otherUser.id}`}>{avatarEl}</Link>
          ) : hasEvent ? (
            <Link to={`/events/${eventSlug}`}>{avatarEl}</Link>
          ) : (
            avatarEl
          )}
          <div className="text-accent-foreground">
            <div className="text-xs mt-0.5 mb-0.5">{conversation.type}</div>
            {isDirect && isValidOtherUser ? (
              <Link to={`/users/${otherUser.id}`} className="text-lg font-bold hover:underline">
                {title}
              </Link>
            ) : hasEvent ? (
              <Link to={`/events/${eventSlug}`} className="text-lg font-bold hover:underline">
                {title}
              </Link>
            ) : (
              <div className="text-lg font-bold">{title}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
