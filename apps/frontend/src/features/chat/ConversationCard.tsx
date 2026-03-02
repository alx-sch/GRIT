import { Card, CardHeader } from '@/components/ui/card';
import { getAvatarImageUrl, getEventImageUrlByKey } from '@/lib/image_utils';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { ResConversationSingle } from '@grit/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trimText } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { chatStore } from '@/store/chatStore';

interface ConversationCardProps {
  conversation: ResConversationSingle;
  isActive: boolean;
}

export const ConversationCard = ({ conversation, isActive }: ConversationCardProps) => {
  const currentUser = useCurrentUserStore((s) => s.user);
  const navigate = useNavigate();

  if (!currentUser) return ''; // Narrowing for Typesafety only

  // Set other user if it is a 1:1 conversation
  const otherUser =
    conversation.type === 'DIRECT'
      ? conversation.participants.find((el) => el.user.id !== currentUser.id)?.user
      : undefined;

  const isEvent = conversation.type === 'EVENT';

  // Image
  const findImageUrl = () => {
    if (conversation.type === 'DIRECT')
      return otherUser?.avatarKey ? getAvatarImageUrl(otherUser.avatarKey) : undefined;
    if (conversation.type === 'EVENT')
      return conversation.event?.imageKey
        ? getEventImageUrlByKey(conversation.event.imageKey)
        : undefined;
  };
  const imageUrl = findImageUrl();

  // Image Fallback
  const getImageFallback = () => {
    if (conversation.type === 'DIRECT') return otherUser?.name?.trim().slice(0, 2).toUpperCase();
    if (conversation.type === 'EVENT')
      return conversation.event.title.trim().slice(0, 2).toUpperCase();
    return '';
  };
  const imageFallback = getImageFallback();

  // Title
  const findTitle = () => {
    if (conversation.type === 'DIRECT') return otherUser?.name;
    else if (conversation.type === 'GROUP') return conversation.title;
    else if (conversation.type === 'EVENT') return conversation.event.title;
    else return 'Conversation';
  };
  const titleLong = findTitle();
  const title = titleLong ? trimText(titleLong, 20) : undefined;

  // Get the matching last message data from the chatStore
  const conversationState = chatStore((s) => {
    return s.conversations[conversation.id];
  });

  // Last Message Text
  const lastMessageTextLong = conversationState?.lastMessage?.text ?? 'No messages yet';
  const lastMessageText = trimText(lastMessageTextLong, 24);

  // Last Message Author
  let lastMessageAuthorNameLong;
  if (conversationState?.lastMessage?.author?.id === currentUser.id)
    lastMessageAuthorNameLong = 'You';
  else lastMessageAuthorNameLong = conversationState?.lastMessage?.author.name;
  const lastMessageAuthor = lastMessageAuthorNameLong
    ? trimText(lastMessageAuthorNameLong, 10)
    : undefined;

  // Last Message Created At
  const lastMessageCreatedAtRaw = conversationState?.lastMessage?.createdAt;
  const lastMessageCreatedAt = lastMessageCreatedAtRaw
    ? new Date(lastMessageCreatedAtRaw).toLocaleDateString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: '2-digit',
      })
    : undefined;

  // Event Start
  const eventStartRaw = conversation.event?.startAt
    ? new Date(conversation.event?.startAt)
    : undefined;
  const eventStart = eventStartRaw?.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  });

  // Has unread
  const lastMessage = conversationState?.lastMessage;
  const lastReadAt = conversationState?.lastReadAt;

  let hasUnread = false;

  // If there are no messages, there cannot be unred messages
  if (!lastMessage) hasUnread = false;
  // Otherwise there must be messages and lastread being null means we have unread
  else if (!lastReadAt) hasUnread = true;
  // Otherwise we must compage
  else hasUnread = new Date(lastMessage.createdAt).getTime() > new Date(lastReadAt).getTime();

  return (
    <>
      <Card
        onClick={() => void navigate(`./${conversation.id}`)}
        className={`hover:-translate-y-1 transition-transform duration-200 mb-1 w-xs cursor-pointer`}
      >
        <CardHeader
          className={`flex flex-row items-center gap-4 space-y-0 relative p-4 ${isActive && 'bg-secondary'}`}
        >
          {hasUnread && (
            <div className="bg-primary johhere w-1.5 h-1.5 rounded-full absolute top-4 right-4"></div>
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
