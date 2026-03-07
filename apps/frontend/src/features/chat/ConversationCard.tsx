import { Card, CardHeader } from '@/components/ui/card';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { ResConversationSingle } from '@grit/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { chatStore } from '@/store/chatStore';
import { mapConversationToCard } from './conversationToCard';

interface ConversationCardProps {
  conversation: ResConversationSingle;
  isActive: boolean;
}

export const ConversationCard = ({ conversation, isActive }: ConversationCardProps) => {
  const navigate = useNavigate();

  const currentUser = useCurrentUserStore((s) => s.user);
  if (!currentUser) return ''; // Narrowing for Typesafety only

  const conversationState = chatStore((s) => {
    return s.conversations[conversation.id];
  });

  const {
    title,
    imageUrl,
    imageFallback,
    lastMessageText,
    lastMessageAuthor,
    lastMessageCreatedAt,
    hasUnread,
    eventStart,
    isEvent,
  } = mapConversationToCard(conversation, conversationState, currentUser);

  return (
    <>
      <Card
        onClick={() => void navigate(`./${conversation.id}`)}
        className={`hover:-translate-y-1 transition-transform duration-200 mb-2 md:w-xs w-full cursor-pointer`}
      >
        <CardHeader
          className={`flex flex-row items-center gap-4 space-y-0 relative p-4 ${isActive && 'bg-secondary'}`}
        >
          {hasUnread && (
            <div className="bg-primary w-1.5 h-1.5 rounded-full absolute top-4 right-4"></div>
          )}
          <div className="relative">
            <div className="text-lg flex items-center absolute -left-1 top-9 z-10">
              {eventStart && (
                <div className="text-xs bg-primary flex items-center h-4 rounded-[2px] text-black min-w-11 justify-center text-center text-nowrap ">
                  {eventStart}
                </div>
              )}
            </div>
            <Avatar className={`h-12 w-12 ${isEvent && 'rounded-[3px]'}`}>
              {imageUrl && <AvatarImage src={imageUrl} />}
              <AvatarFallback className={`h-12 w-12 ${isEvent && 'rounded-[3px]'}`}>
                {imageFallback}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="w-full">
            <div className="font-medium flex items-center leading-tight">{title}</div>
            {/* <div className="text-xs">/ {conversation.type}</div> */}
            <div className="text-[14px] text-muted-foreground italic -ml-0.5">
              {lastMessageAuthor && `${lastMessageAuthor}: `}
              {lastMessageText}
            </div>
            <div className="text-[11px] text-right text-muted-foreground">
              {lastMessageCreatedAt ?? `–`}
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  );
};
