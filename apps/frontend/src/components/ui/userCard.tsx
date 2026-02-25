import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResUserPublic } from '@grit/schema';
import { getAvatarImageUrl } from '@/lib/image_utils';
import { MessageCircleMore } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { conversationService } from '@/services/conversationService';
import { type ConversationRes } from '@grit/schema';
import { useCurrentUserStore } from '@/store/currentUserStore';

export const UserCard = ({ user }: { user: ResUserPublic }) => {
  const displayName = user.name ?? 'User';
  const navigate = useNavigate();
  function startChat() {
    void startChatAsync();
  }
  const currentUser = useCurrentUserStore((s) => s.user);

  async function startChatAsync() {
    try {
      const res: ConversationRes = await conversationService.getConversation({
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
            <AvatarImage
              src={user?.avatarKey ? getAvatarImageUrl(user.avatarKey) : undefined}
              seed={user?.id?.toString() ?? 'user'}
            />
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
