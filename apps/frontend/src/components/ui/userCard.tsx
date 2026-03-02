import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResConversationSingleId, ResUserPublic } from '@grit/schema';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { MessageCircleMore } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { conversationService } from '@/services/conversationService';
import { useCurrentUserStore } from '@/store/currentUserStore';
// import { useSocket } from '@/providers/socketProvider';

export const UserCard = ({ user }: { user: ResUserPublic }) => {
  const displayName = user.name ?? 'User';
  const navigate = useNavigate();
  const currentUser = useCurrentUserStore((s) => s.user);
  // const socket = useSocket();

  // To make fucking linting happy
  function startChat() {
    void startChatAsync();
  }
  async function startChatAsync() {
    try {
      // This will either get an existing conversation or create it
      const res: ResConversationSingleId = await conversationService.getConversation({
        type: 'DIRECT',
        directId: user.id,
      });
      // In case we created a new conversation, our client socket needs to join the created room
      // socket?.emit('joinConversation', { conversationId: res.id });

      void navigate(`/chat/${res.id}`);
    } catch (err) {
      console.error(err);
    }
  }
  return (
    <>
      <Card key={user.id} className="hover:-translate-y-1 transition-transform duration-200">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
          <Avatar className="h-12 w-12 border-2 border-black">
            <AvatarImage src={getAvatarImageUrl(user.avatarKey ?? undefined)} />
            <AvatarFallback name={displayName} />
          </Avatar>
          <div className="flex flex-1 justify-between">
            <div className="overflow-hidden">
              <CardTitle className="text-base truncate">{displayName}</CardTitle>
            </div>
            {currentUser && currentUser?.id !== user.id && (
              <MessageCircleMore className="cursor-pointer" onClick={startChat} />
            )}
          </div>
        </CardHeader>
      </Card>
    </>
  );
};
