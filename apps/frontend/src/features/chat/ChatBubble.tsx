import type { ResChatMessage } from '@grit/schema';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { UserAvatar } from '@/components/ui/user-avatar';
import { timestampToLocalTime } from '@/lib/time_utils';
import { Link } from 'react-router-dom';

// Detect and render links (especially useful for event invites)
const renderMessageWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const ChatBubble = ({ message }: { message: ResChatMessage }) => {
  const currentUser = useCurrentUserStore((s) => s.user);
  const author = message.author ?? { id: null, name: 'Unknown', displayName: 'Unknown', avatarKey: null };
  const isFromCurrentUser = currentUser?.id === author.id;
  const align = isFromCurrentUser ? 'justify-end' : 'justify-start';
  const isDeletedUser = author.id === null;

  return (
    <>
      <div className={`${align} flex my-4`}>
        <div className={`border border-input p-2 px-3 max-w-9/10 md:max-w-4/5 lg:max-w-3/5 flex`}>
          {!isFromCurrentUser && (
            <div className="mr-2">
              {isDeletedUser ? (
                <UserAvatar user={author} size="xs" />
              ) : (
                <Link to={`/users/${author.id}`}>
                  <UserAvatar user={author} size="xs" />
                </Link>
              )}
            </div>
          )}
          <div className="text-sm">
            {!isFromCurrentUser && (
              <div className="font-bold uppercase text-xs block">
                {isDeletedUser ? (
                  <span>{author.displayName ?? author.name}</span>
                ) : (
                  <Link to={`/users/${author.id}`} className="hover:underline">
                    {author.displayName ?? author.name}
                  </Link>
                )}
              </div>
            )}
            <span>{renderMessageWithLinks(message.text)}</span>{' '}
            <div className="text-right text-xs mt-1">{timestampToLocalTime(message.createdAt)}</div>
          </div>
        </div>
      </div>
    </>
  );
};
