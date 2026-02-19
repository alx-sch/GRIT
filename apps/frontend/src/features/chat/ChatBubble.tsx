import type { ResChatMessage } from '@grit/schema';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { timestampToLocalTime } from '@/lib/time_utils';

export const ChatBubble = ({ message }: { message: ResChatMessage }) => {
  const currentUser = useCurrentUserStore((s) => s.user);
  const isFromCurrentUser = currentUser?.id === message.author.id;
  const align = isFromCurrentUser ? 'justify-end' : 'justify-start';
  const authorDisplay = message.author?.name || 'User';

  return (
    <>
      <div className={`${align} flex my-4`}>
        <div className={`border border-input p-2 max-w-4/5 flex`}>
          {!isFromCurrentUser && (
            <Avatar className="mr-2 w-6 h-6">
              <AvatarImage src={getAvatarImageUrl(message.author.avatarKey ?? undefined)} />
              <AvatarFallback name={authorDisplay} />
            </Avatar>
          )}
          <div>
            {!isFromCurrentUser && (
              <div className="font-bold uppercase text-xs">{message.author.name}</div>
            )}
            {message.text}
            <div className="text-right text-xs mt-1">{timestampToLocalTime(message.createdAt)}</div>
          </div>
        </div>
      </div>
    </>
  );
};
