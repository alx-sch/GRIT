import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { getAvatarImageUrl, getEventImageUrlByKey } from '@/lib/image_utils';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { ResConversationSingle } from '@grit/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trimText } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type ConversationCardProps = {
  conversation: ResConversationSingle;
  isActive: boolean;
};

export const ConversationCard = ({ conversation, isActive }: ConversationCardProps) => {
  const currentUser = useCurrentUserStore((s) => s.user);
  if (!currentUser) return ''; // Narrowing for Typesafety only
  const otherUser =
    conversation.type === 'DIRECT'
      ? conversation.participants.find((el) => el.user.id !== currentUser.id)?.user
      : undefined;
  const isEvent = conversation.type === 'EVENT';
  const navigate = useNavigate();

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

  // Last Message Text
  const findLastMessage = () => {
    if (conversation.messages && conversation.messages.length > 0)
      return conversation.messages[0].text;
    return 'No messages yet';
  };
  const lastMessageTextLong = findLastMessage();
  const lastMessageText = trimText(lastMessageTextLong, 24);

  // Last Message Author
  const findLastMessageAuthor = () => {
    if (conversation.messages && conversation.messages.length > 0) {
      if (conversation.messages[0].author.id === currentUser.id) return 'You';
      else return conversation.messages[0].author.name;
    } else return '';
  };
  const lastMessageAuthorLong = findLastMessageAuthor();
  const lastMessageAuthor = lastMessageAuthorLong ? trimText(lastMessageAuthorLong, 10) : undefined;

  // Last Message Created At
  const messageCreatedAtRaw = conversation.messages?.[0]?.createdAt
    ? new Date(conversation.messages[0].createdAt)
    : undefined;
  const messageCreatedAt = messageCreatedAtRaw?.toLocaleDateString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: '2-digit',
  });

  // Event Start
  const eventStartRaw = conversation.event?.startAt
    ? new Date(conversation.event?.startAt)
    : undefined;
  const eventStart = eventStartRaw?.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  });

  return (
    <>
      <Card
        onClick={() => navigate(`./${conversation.id}`)}
        className={`hover:-translate-y-1 transition-transform duration-200 mb-1 cursor-pointer`}
      >
        <CardHeader
          className={`flex flex-row items-center gap-4 space-y-0 p-4 ${isActive && 'bg-secondary'}`}
        >
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
              {messageCreatedAt || `–`}
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  );
};
