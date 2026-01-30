import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EventBase } from '@/types/event';
import { useChat } from '@/hooks/useChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatBubble } from '@/components/ui/chatBubble';

export const Chat = ({ event }: { event: EventBase }) => {
  const { messages, sendMessage } = useChat(event.id);
  const [input, setInput] = useState('');

  return (
    <>
      <ScrollArea className="h-[300px] border px-4 border-input mt-4 mb-4 flex">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </ScrollArea>

      <Textarea
        className="mb-2 rounded-none"
        placeholder="Type your message here."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <Button
        onClick={() => {
          sendMessage(input);
          setInput('');
        }}
      >
        Send
      </Button>
    </>
  );
};
