import { SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { WebSocketGateway } from '@nestjs/websockets';
import { ConnectedSocket } from '@nestjs/websockets';
import type { Socket } from 'dgram';

@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('chat')
  handleChat(@MessageBody() body: any, @ConnectedSocket() client: Socket): any {
    console.log(body);
    client.emit('message', 'Hey from server');
    return body;
  }
}
