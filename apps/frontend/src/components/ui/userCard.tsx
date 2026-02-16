import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResConversationSingleId, ResUserPublic } from '@grit/schema';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { MessageCircleMore } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { conversationService } from '@/services/conversationService';
import { type ConversationBase } from '@grit/schema';
import { useCurrentUserStore } from '@/store/currentUserStore';

export const UserCard = ({ user }: { user: ResUserPublic }) => {
  const name = user.name ?? 'Unknown user';
  const initials = name.trim().slice(0, 2).toUpperCase();
  const navigate = useNavigate();
  const currentUser = useCurrentUserStore((s) => s.user);

  // To make fucking linting happy
  function startChat() {
    void startChatAsync();
  }
  async function startChatAsync() {
    try {
      const res: ResConversationSingleId = await conversationService.getConversation({
        type: 'DIRECT',
        directId: user.id,
      });

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
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 justify-between">
            <div className="overflow-hidden">
              <CardTitle className="text-base truncate">{name}</CardTitle>
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
