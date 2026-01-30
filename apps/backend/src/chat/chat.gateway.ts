import { SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { WebSocketGateway } from '@nestjs/websockets';
import { ConnectedSocket } from '@nestjs/websockets';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '@/auth/auth.service';
import { UserService } from '@/user/user.service';

// The WebsocketGateway creates the socket similar to `const io = new Server();` and listens to it with .listen internally
@WebSocketGateway()
export class ChatGateway {
  // First check on connection that user has a valid token
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return client.disconnect();

    const userId = await this.authService.verifyToken(token);
    if (!userId) return client.disconnect();

    const user = await this.userService.userGetById(userId);
    if (!user) return client.disconnect();

    client.data.userId = user.id;
    client.data.userName = user.name;
  }

  // With the WebSocketServer decorator we get an instance of the server. This is the same as the io object from raw Socket.IO.
  @WebSocketServer()
  private server!: Server;

  @SubscribeMessage('join')
  handleJoin(@MessageBody() body: { eventId: string }, @ConnectedSocket() client: Socket) {
    client.join(`event:${body.eventId}`);
    // We lock down which room (eventId) this socket belongs to
    client.data.eventId = body.eventId;
  }

  // The client sends XYZ and we handle it with handleXYZ, this could be named anything
  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: { text: string }, @ConnectedSocket() client: Socket) {
    const eventId = client.data.eventId;

    console.log(this.server.sockets.adapter.rooms);
    this.server.to(`event:${eventId}`).emit('message', {
      eventId,
      text: body.text,
      time: new Date().toISOString(),
      userId: client.data.userId,
      userName: client.data.userName,
    });
  }
}
