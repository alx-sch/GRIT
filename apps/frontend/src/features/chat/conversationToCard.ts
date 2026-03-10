import { getAvatarImageUrl, getEventImageUrlByKey } from '@/lib/image_utils';
import { trimText } from '@/lib/utils';
import { CurrentUser } from '@/types/user';
import { ResConversationOverview, ResConversationState } from '@grit/schema';

export function mapConversationToCard(
  conversation: ResConversationOverview[number],
  conversationState: ResConversationState,
  currentUser: CurrentUser
) {
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
      return conversation.event?.title?.trim().slice(0, 2).toUpperCase() ?? '?';
    return '';
  };
  const imageFallback = getImageFallback();

  // Title
  const findTitle = () => {
    if (conversation.type === 'DIRECT') return otherUser?.name;
    else if (conversation.type === 'GROUP') return conversation.title;
    else if (conversation.type === 'EVENT') return conversation.event?.title ?? 'Event';
    else return 'Conversation';
  };
  const titleLong = findTitle();
  const title = titleLong ? trimText(titleLong, 20) : undefined;

  // Last Message Text
  const lastMessageTextLong = conversationState?.lastMessage?.text ?? 'No messages yet';
  const lastMessageText = trimText(lastMessageTextLong, 24);

  // Last Message Author
  let lastMessageAuthorNameLong;
  if (conversationState?.lastMessage?.author?.id === currentUser.id)
    lastMessageAuthorNameLong = 'You';
  else lastMessageAuthorNameLong = conversationState?.lastMessage?.author?.name;
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
  // Otherwise there must be messages and lastread being null means we have
  // unread
  else if (!lastReadAt) hasUnread = true;
  // Otherwise we must compage
  else hasUnread = new Date(lastMessage.createdAt).getTime() > new Date(lastReadAt).getTime();

  return {
    isEvent,
    title,
    imageUrl,
    imageFallback,
    lastMessageText,
    lastMessageAuthor,
    lastMessageCreatedAt,
    hasUnread,
    eventStart,
  };
}
