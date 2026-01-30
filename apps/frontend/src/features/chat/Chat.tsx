import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EventBase } from '@/types/event';
import { useChat } from '@/hooks/useChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentUserStore } from '@/store/currentUserStore';

export const Chat = ({ event }: { event: EventBase }) => {
  const { messages, sendMessage } = useChat(event.id);
  const [input, setInput] = useState('');
  const currentUser = useCurrentUserStore((s) => s.user);

  return (
    <>
      <ScrollArea className="h-[300px] border p-4 border-input mt-4 mb-4">
        {messages.map((message, i) => (
          <div key={i}>{message.text}</div>
        ))}{' '}
      </ScrollArea>

      <Textarea
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
