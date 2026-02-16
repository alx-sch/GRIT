import { ResConversationSingle } from '@grit/schema';

export const ChatBoxHeader = ({ conversation }: { conversation: ResConversationSingle }) => {
  return (
    <>
      <div className="bg-primary text-black p-3 mt-1 mb-4">{conversation.type}</div>
    </>
  );
};
