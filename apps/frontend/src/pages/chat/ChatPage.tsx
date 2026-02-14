import { useParams } from 'react-router-dom';
import { ChatBox } from '@/features/chat/ChatBox';
import { JoinType } from '@grit/schema';

export function ChatPage() {
  const { id } = useParams();
  return (
    <div>
      <ChatBox joinType={JoinType.DIRECT} id={id!} />
    </div>
  );
}
