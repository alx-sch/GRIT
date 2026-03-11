import type { ResChatMessage } from '@grit/schema';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { UserAvatar } from '@/components/ui/user-avatar';
import { timestampToLocalTime } from '@/lib/time_utils';
import { Link } from 'react-router-dom';

export const ChatBubble = ({ message }: { message: ResChatMessage }) => {
  const currentUser = useCurrentUserStore((s) => s.user);
  const author = message.author ?? { id: null, name: 'Unknown', avatarKey: null };
  const isFromCurrentUser = currentUser?.id === author.id;
  const align = isFromCurrentUser ? 'justify-end' : 'justify-start';
  return (
    <>
      <div className={`${align} flex my-4`}>
        <div className={`border border-input p-2 px-3 max-w-9/10 md:max-w-4/5 lg:max-w-3/5 flex`}>
          {!isFromCurrentUser && (
            <Link to={`/users/${author.id}`} className="mr-2">
              <UserAvatar user={author} size="xs" />
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
