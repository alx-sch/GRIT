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
import { ChatService } from '@/chat/chat.service';
import { randomUUID } from 'crypto';
import { ReqChatMessagePostDto, ReqChatJoinSchemaDto } from '@/chat/chat.schema';
import { ResChatMessageSchema } from '@grit/schema';

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
    private readonly chatService: ChatService,
    private readonly userService: UserService
  ) {}

  // Middleware in which we make sure that we first enrich the socket data with user data before allowing anything else
  afterInit(server: Server) {
    server.use(async (socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));

      const userId = this.authService.verifyToken(token);
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
  async handleJoin(@MessageBody() body: ReqChatJoinSchemaDto, @ConnectedSocket() client: Socket) {
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

    // Get message histroy to prefill chat
    const rows = await this.chatService.loadRecentForEvent(body.eventId);
    // Serialization in Websocket context
    const history = rows.map((row) => ResChatMessageSchema.parse(row));
    client.emit('history', history);
  }

  // The client sends XYZ and we handle it with handleXYZ, this could be named anything
  @SubscribeMessage('message')
  handleMessage(@MessageBody() body: ReqChatMessagePostDto, @ConnectedSocket() client: Socket) {
    const eventId = client.data.eventId;
    // Client must have joined an even room
    if (!eventId) {
      client.disconnect();
      return null;
    }
    const id = randomUUID();
    const sentAt = new Date();

    // Emit immediately (realtime first)
    this.server.to(`event:${eventId}`).emit('message', {
      id,
      eventId,
      text: body.text,
      sentAt,
      author: {
        id: client.data.userId,
        name: client.data.userName,
        avatarKey: client.data.userAvatarKey,
      },
    });

    // Persist asynchronously (durability second)
    this.chatService.save({
      id,
      eventId,
      authorId: client.data.userId,
      text: body.text,
      sentAt,
    });
  }
}
