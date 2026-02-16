import { useParams } from 'react-router-dom';
import { ChatBox } from '@/features/chat/ChatBox';

export function ChatPage() {
  const { id } = useParams();
  if (!id) return <div>Chat id missing</div>;
  return (
    <div>
      <ChatBox key={id} conversationId={id} />
    </div>
  );
}
