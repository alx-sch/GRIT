import { chatStore } from '@/store/chatStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import { ResConversationSingle } from '@grit/schema';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mapConversationToCard } from './conversationToCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const ChatBoxHeader = ({ conversation }: { conversation: ResConversationSingle }) => {
  const navigate = useNavigate();

  const currentUser = useCurrentUserStore((s) => s.user);
  if (!currentUser) return ''; // Narrowing for Typesafety only

  const conversationState = chatStore((s) => {
    return s.conversations[conversation.id];
  });

  const { title, imageUrl, imageFallback, isEvent } = mapConversationToCard(
    conversation,
    conversationState,
    currentUser
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
          <Avatar className={`h-12 w-12 mr-3 ${isEvent && 'rounded-[3px]'}`}>
            {imageUrl && <AvatarImage src={imageUrl} />}
            <AvatarFallback className={`h-12 w-12 test ${isEvent && 'rounded-[3px]'}`}>
              {imageFallback}
            </AvatarFallback>
          </Avatar>
          <div className="text-accent-foreground">
            <div className="text-xs mt-0.5 mb-0.5">{conversation.type}</div>
            <div className="text-lg font-bold">{title}</div>
          </div>
        </div>
      </div>
    </>
  );
};
