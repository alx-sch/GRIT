import { AuthService } from '@/auth/auth.service';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketServer,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket, type DefaultEventsMap } from 'socket.io';
import { UserService } from '@/user/user.service';
import { ChatService } from '@/chat/chat.service';
import { randomUUID } from 'crypto';
import { ReqChatMessagePostDto, ReqChatJoinDto } from '@/chat/chat.schema';
import { ResChatMessageSchema, ReqSocketAuthSchema, ReqChatJoinSchema } from '@grit/schema';
import { ConversationService } from '@/conversation/conversation.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { ArgumentsHost, Catch, UseFilters, UsePipes, WsExceptionFilter } from '@nestjs/common';

interface SocketData {
  userId: number;
  userName: string;
  userAvatarKey?: string;
  conversationId?: string;
}

export type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
export type AppServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

// Custom filter to print Zod validation errors in Websocket context. Otherwise these fail silently.
@Catch()
export class AllWsExceptionsFilter implements WsExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    console.error('WS Exception:', exception);

    const client = host.switchToWs().getClient();
    client.emit('error', {
      message: exception.message ?? 'Validation failed',
    });
  }
}

// The WebsocketGateway creates the socket similar to `const io = new Server();` and listens to it with .listen internally
@UsePipes(new ZodValidationPipe()) // Need to add zod validation pipe to Websocket Gateway manually since otherwise not applied from global setup
@UseFilters(new AllWsExceptionsFilter())
@WebSocketGateway()
export class ChatGateway {
  // With the WebSocketServer decorator we get an instance of the server. This is the same as the io object from raw Socket.IO.
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly conversation: ConversationService
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
  async handleJoin(@MessageBody() body: ReqChatJoinDto, @ConnectedSocket() client: AppSocket) {
    console.log('Join message received for ', body);
    // TODO Check AGAIN if the client is allowed to join the chat room
    await client.join(body.id);
    // We lock down which conversation this socket belongs to
    client.data.conversationId = body.id;
    // Get message history to prefill chat
    const rows = await this.chatService.loadMessages(body.id);
    // Serialization in Websocket context
    const history = rows.reverse().map((row) => ResChatMessageSchema.parse(row));
    client.emit('history', history);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() body: ReqChatMessagePostDto,
    @ConnectedSocket() client: AppSocket
  ) {
    const conversationId = client.data.conversationId;
    // Client must have joined an event room
    if (!conversationId) {
      client.disconnect();
      return null;
    }
    const id = randomUUID();

    // Emit immediately (realtime first)
    const res = {
      id,
      conversationId,
      text: body.text,
      author: {
        id: client.data.userId,
        name: client.data.userName,
        avatarKey: client.data.userAvatarKey,
      },
      createdAt: new Date(),
    };
    const message = ResChatMessageSchema.parse(res);
    this.server.to(conversationId).emit('message', message);

    // Persist asynchronously (durability second)
    await this.chatService.saveMessage({
      id,
      conversationId,
      authorId: client.data.userId,
      text: body.text,
    });
  }

  // @SubscribeMessage('load_more')
  // async handleLoadMore(
  //   @MessageBody() body: { cursorSentAt: string; cursorId: string },
  //   @ConnectedSocket() client: AppSocket
  // ) {
  //   const eventId = client.data.eventId;
  //   if (!eventId) return null;

  //   const rows = await this.chatService.loadMessages(eventId, 2, {
  //     createdAt: new Date(body.cursorSentAt),
  //     id: body.cursorId,
  //   });

  //   if (rows.length === 0) {
  //     client.emit('history_end');
  //     return;
  //   }

  //   const messages = rows.reverse().map((row) => ResChatMessageSchema.parse(row));
  //   client.emit('history', messages);
  // }
}
