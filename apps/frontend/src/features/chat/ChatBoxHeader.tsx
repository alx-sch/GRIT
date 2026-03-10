import { chatStore } from '@/store/chatStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { ResConversationSingle } from '@grit/schema';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { mapConversationToCard } from './conversationToCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const ChatBoxHeader = ({ conversation }: { conversation: ResConversationSingle }) => {
  const navigate = useNavigate();

  const currentUser = useCurrentUserStore((s) => s.user);
  if (!currentUser) return ''; // Narrowing for Typesafety only

  const conversationState = chatStore((s) => {
    return s.conversations[conversation.id];
  });

  const { title, imageUrl, imageFallback } = mapConversationToCard(
    conversation,
    conversationState,
    currentUser
  );

  const otherUser =
    conversation.type === 'DIRECT'
      ? conversation.participants.find((el) => el.user.id !== currentUser.id)?.user
      : undefined;

  const isDirect = conversation.type === 'DIRECT';
  const isEventChat = conversation.type === 'EVENT';
  const eventSlug = conversation.event?.slug;
  const hasEvent = isEventChat && eventSlug;

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
          {isDirect && otherUser ? (
            <Link to={`/users/${otherUser.id}`}>
              <Avatar className={`h-12 w-12 mr-3 ${isEventChat && 'rounded-[3px]'}`}>
                {imageUrl && <AvatarImage src={imageUrl} />}
                <AvatarFallback className={`h-12 w-12 test ${isEventChat && 'rounded-[3px]'}`}>
                  {imageFallback}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : hasEvent ? (
            <Link to={`/events/${eventSlug}`}>
              <Avatar className={`h-12 w-12 mr-3 ${isEventChat && 'rounded-[3px]'}`}>
                {imageUrl && <AvatarImage src={imageUrl} />}
                <AvatarFallback className={`h-12 w-12 test ${isEventChat && 'rounded-[3px]'}`}>
                  {imageFallback}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className={`h-12 w-12 mr-3 ${isEventChat && 'rounded-[3px]'}`}>
              {imageUrl && <AvatarImage src={imageUrl} />}
              <AvatarFallback className={`h-12 w-12 test ${isEventChat && 'rounded-[3px]'}`}>
                {imageFallback}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="text-accent-foreground">
            <div className="text-xs mt-0.5 mb-0.5">{conversation.type}</div>
            {isDirect && otherUser ? (
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
