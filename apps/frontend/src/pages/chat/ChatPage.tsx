import { useParams } from 'react-router-dom';
import { ChatBox } from '@/features/chat/ChatBox';

export function ChatPage({ propConversationId }: { propConversationId?: string }) {
  const { id: paramId } = useParams();
  const activeId = propConversationId ?? paramId;
  if (!activeId) return <div>Chat id missing</div>;
  return (
    <div>
      <ChatBox key={activeId} conversationId={activeId} />
    </div>
  );
}
