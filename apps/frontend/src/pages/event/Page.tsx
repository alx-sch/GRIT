import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { Heading } from '@/components/ui/typography';
import { Container } from '@/components/layout/Container';
import { io } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export const eventLoader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.id) throw new Response('Not Found', { status: 404 });
  const event = await eventService.getEvent(params.id);
  return event;
};

export const Event = () => {
  const event = useLoaderData<typeof eventLoader>();

  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('message', {
      eventId: event.id,
      text: input,
      time: new Date(),
    });

    setInput('');
  };

  useEffect(() => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { eventId: event.id }, (response: any) => {
        console.log('server response:', response);
      });
    });

    socket.on('message', (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [event.id]);

  return (
    <>
      <Container>
        <Heading level={1}>{event.title}</Heading>
        {messages.map((message) => {
          return message;
        })}
        <Textarea
          placeholder="Type your message here."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button onClick={sendMessage}>Send</Button>
      </Container>
    </>
  );
};
