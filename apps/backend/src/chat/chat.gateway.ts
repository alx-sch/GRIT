import { SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { WebSocketGateway } from '@nestjs/websockets';
import { ConnectedSocket } from '@nestjs/websockets';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  private server!: Server;

  @SubscribeMessage('join')
  handleJoin(@MessageBody() body: { eventId: string }, @ConnectedSocket() client: Socket) {
    client.join(`event:${body.eventId}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: { eventId: string; text: string }) {
    console.log(this.server.sockets.adapter.rooms);
    this.server.to(`event:${body.eventId}`).emit('message', body.text);
  }
}
