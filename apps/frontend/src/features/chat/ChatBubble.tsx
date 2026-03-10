import type { ResChatMessage } from '@grit/schema';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { timestampToLocalTime } from '@/lib/time_utils';
import { Link } from 'react-router-dom';

export const ChatBubble = ({ message }: { message: ResChatMessage }) => {
  const currentUser = useCurrentUserStore((s) => s.user);
  const author = message.author ?? { id: null, name: 'Unknown', avatarKey: null };
  const isFromCurrentUser = currentUser?.id === author.id;
  const align = isFromCurrentUser ? 'justify-end' : 'justify-start';
  const initials = author.name?.trim().slice(0, 2).toUpperCase() ?? '??';
  return (
    <>
      <div className={`${align} flex my-4`}>
        <div className={`border border-input p-2 px-3 max-w-9/10 md:max-w-4/5 lg:max-w-3/5 flex`}>
          {!isFromCurrentUser && (
            <Link to={`/users/${author.id}`} className="mr-2">
              <Avatar className="w-6 h-6">
                <AvatarImage
                  src={
                    message.author?.avatarKey
                      ? getAvatarImageUrl(message.author.avatarKey)
                      : undefined
                  }
                  seed={message.author?.id?.toString() ?? 'user'}
                />
                <AvatarFallback name={initials} />
              </Avatar>
            </Link>
          )}
          <div className="text-sm">
            {!isFromCurrentUser && (
              <Link
                to={`/users/${author.id}`}
                className="font-bold uppercase text-xs hover:underline block"
              >
                {author.name}
              </Link>
            )}
            <span>{message.text}</span>
            <div className="text-right text-xs mt-1">{timestampToLocalTime(message.createdAt)}</div>
          </div>
        </div>
      </div>
    </>
  );
};
