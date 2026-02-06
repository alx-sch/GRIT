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
import { ResChatMessageSchema, ReqSocketAuthSchema } from '@grit/schema';
import 'socket.io';
import type { DefaultEventsMap } from 'socket.io';

interface SocketData {
  userId: number;
  userName: string;
  userAvatarKey?: string;
  eventId?: number;
}

export type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
export type AppServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

// The WebsocketGateway creates the socket similar to `const io = new Server();` and listens to it with .listen internally
@WebSocketGateway()
export class ChatGateway {
  // With the WebSocketServer decorator we get an instance of the server. This is the same as the io object from raw Socket.IO.
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
    private readonly userService: UserService
  ) {}

  // afterInit runs ONCE when the gateway is initialized. We can install middleware in here.
  afterInit(server: Server) {
    // This registers a Socket.IO middleware. It does not run immediately but for every incoming connection attempt. socket will be the client that tries to connect
    server.use((socket: AppSocket, next) => {
      const parsed_token = ReqSocketAuthSchema.safeParse(socket.handshake.auth);
      if (!parsed_token.success) {
        next(new Error('Unauthorized'));
        return;
      }
      void (async () => {
        const token = parsed_token.data.token;
        const userId = this.authService.verifyToken(token);
        if (!userId) {
          next(new Error('Unauthorized'));
          return;
        }

        const user = await this.userService.userGetById(userId);
        if (!user) {
          next(new Error('Unauthorized'));
          return;
        }

        socket.data.userId = user.id;
        socket.data.userName = user.name ?? 'No username';
        socket.data.userAvatarKey = user.avatarKey ?? undefined;

        next();
      })();
    });
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() body: ReqChatJoinSchemaDto,
    @ConnectedSocket() client: AppSocket
  ) {
    // Check if the client is allowed to join the chat room
    const userIsAttendingEvent = await this.userService.userIsAttendingEvent(
      client.data.userId,
      body.eventId
    );
    if (!userIsAttendingEvent) {
      client.disconnect();
      return 0;
    }
    await client.join(`event:${String(body.eventId)}`);
    // We lock down which room (eventId) this socket belongs to
    client.data.eventId = body.eventId;

    // Get message history to prefill chat
    const rows = await this.chatService.loadMessages(body.eventId);
    const messages = rows.reverse().map((row) => ResChatMessageSchema.parse(row));
    // Serialization in Websocket context
    const history = messages.map((message) => ResChatMessageSchema.parse(message));
    client.emit('history', history);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() body: ReqChatMessagePostDto,
    @ConnectedSocket() client: AppSocket
  ) {
    const eventId = client.data.eventId;
    // Client must have joined an event room
    if (!eventId) {
      client.disconnect();
      return null;
    }
    const id = randomUUID();

    // Emit immediately (realtime first)
    const res = {
      id,
      eventId,
      text: body.text,
      author: {
        id: client.data.userId,
        name: client.data.userName,
        avatarKey: client.data.userAvatarKey,
      },
      createdAt: new Date(),
    };
    const message = ResChatMessageSchema.parse(res);
    this.server.to(`event:${String(eventId)}`).emit('message', message);

    // Persist asynchronously (durability second)
    await this.chatService.saveMessage({
      id,
      eventId,
      authorId: client.data.userId,
      text: body.text,
    });
  }

  @SubscribeMessage('load_more')
  async handleLoadMore(
    @MessageBody() body: { cursorSentAt: string; cursorId: string },
    @ConnectedSocket() client: AppSocket
  ) {
    const eventId = client.data.eventId;
    if (!eventId) return null;

    const rows = await this.chatService.loadMessages(eventId, 2, {
      createdAt: new Date(body.cursorSentAt),
      id: body.cursorId,
    });

    if (rows.length === 0) {
      client.emit('history_end');
      return;
    }

    const messages = rows.reverse().map((row) => ResChatMessageSchema.parse(row));
    client.emit('history', messages);
  }
}
