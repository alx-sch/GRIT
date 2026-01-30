import { AuthService } from '@/auth/auth.service';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketServer,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from '@/user/user.service';
import { randomUUID } from 'crypto';

// TODO Need to add validation

// The WebsocketGateway creates the socket similar to `const io = new Server();` and listens to it with .listen internally
@WebSocketGateway()
export class ChatGateway {
  // With the WebSocketServer decorator we get an instance of the server. This is the same as the io object from raw Socket.IO.
  @WebSocketServer()
  private server!: Server;

  // First check on connection that user has a valid token
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  // Middleware in which we make sure that we first enrich the socket data with user data before allowing anything else
  afterInit(server: Server) {
    server.use(async (socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));

      const userId = await this.authService.verifyToken(token);
      if (!userId) return next(new Error('Unauthorized'));

      const user = await this.userService.userGetById(userId);
      if (!user) return next(new Error('Unauthorized'));

      socket.data.userId = user.id;
      socket.data.userName = user.name;
      socket.data.userAvatarKey = user.avatarKey;

      next();
    });
  }

  @SubscribeMessage('join')
  async handleJoin(@MessageBody() body: { eventId: number }, @ConnectedSocket() client: Socket) {
    // Check if the client is allowed to join the chat room
    const userIsAttendingEvent = await this.userService.userIsAttendingEvent(
      client.data.userId,
      body.eventId
    );
    if (!userIsAttendingEvent) {
      client.disconnect();
      return 0;
    }
    client.join(`event:${body.eventId}`);
    // We lock down which room (eventId) this socket belongs to
    client.data.eventId = body.eventId;
  }

  // The client sends XYZ and we handle it with handleXYZ, this could be named anything
  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: { text: string }, @ConnectedSocket() client: Socket) {
    const eventId = client.data.eventId;
    // Client must have joined an eventId (room) before accepting a message
    if (!eventId) {
      client.disconnect();
      return null;
    }
    this.server.to(`event:${eventId}`).emit('message', {
      eventId,
      text: body.text,
      sentAt: new Date().toISOString(),
      userId: client.data.userId,
      userName: client.data.userName,
      avatarKey: client.data.userAvatarKey,
      id: randomUUID(),
    });
  }
}
