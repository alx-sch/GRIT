// test-socket.ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('connected:', socket.id);

  socket.emit('chat', { id: 42 }, (response: number) => {
    console.log('server response:', response);
  });
});

socket.on('message', (msg) => {
  console.log(msg);
});
