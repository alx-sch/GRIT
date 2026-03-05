import { AuthService } from '@/auth/auth.service';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketServer,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket, type DefaultEventsMap } from 'socket.io';
import { UserService } from '@/user/user.service';
import { ChatService } from '@/chat/chat.service';
import { randomUUID } from 'crypto';
import { ReqChatMessagePostDto, ReqChatJoinDto } from '@/chat/chat.schema';
import { ResChatMessageSchema, ReqSocketAuthSchema } from '@grit/schema';
import { ConversationService } from '@/conversation/conversation.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { ArgumentsHost, Catch, UseFilters, UsePipes, WsExceptionFilter } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { env } from '@/config/env';

interface SocketData {
  userId: number;
  userName: string;
  userAvatarKey?: string;
  isAdmin: boolean;
  conversationId?: string;
}

export type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
export type AppServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

// Custom filter to print Zod validation errors in Websocket context. Otherwise these fail silently.
@Catch()
export class AllWsExceptionsFilter implements WsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<AppSocket>();

    let message = 'Validation failed';

    if (exception instanceof WsException) {
      const error = exception.getError();
      message = typeof error === 'string' ? error : JSON.stringify(error);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    client.emit('error', { message });
  }
}

// The WebsocketGateway creates the socket similar to `const io = new Server();` and listens to it with .listen internally
@UsePipes(new ZodValidationPipe()) // Need to add zod validation pipe to Websocket Gateway manually since otherwise not applied from global setup
@UseFilters(new AllWsExceptionsFilter())
@WebSocketGateway({
  cors: {
    origin: [env.FRONTEND_URL, 'http://localhost:5173'],
    credentials: true,
  },
})
export class ChatGateway {
  // With the WebSocketServer decorator we get an instance of the server. This is the same as the io object from raw Socket.IO.
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly conversation: ConversationService,
    private readonly prisma: PrismaService
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
        socket.data.userName = user.name;
        socket.data.userAvatarKey = user.avatarKey ?? undefined;
        socket.data.isAdmin = user.isAdmin;

        next();
      })();
    });
  }

  @SubscribeMessage('join')
  async handleJoin(@MessageBody() body: ReqChatJoinDto, @ConnectedSocket() client: AppSocket) {
    // Check if the current user is allowed to join the room for the conversation id
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: body.id,
        participants: {
          some: {
            userId: client.data.userId,
          },
        },
      },
    });
    if (!conversation && !client.data.isAdmin)
      throw new WsException('You are not allowed to view this conversation');
    else await client.join(body.id);

    // We lock down which conversation this socket belongs to
    client.data.conversationId = body.id;
    // Get message history to prefill chat
    const rows = await this.chatService.loadMessages(body.id);
    // Serialization in Websocket context
    const history = rows.reverse().map((row) => ResChatMessageSchema.parse(row));
    client.emit('user_info', { isAdmin: client.data.isAdmin });
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

  @SubscribeMessage('load_more')
  async handleLoadMore(
    @MessageBody() body: { cursorSentAt: string; cursorId: string },
    @ConnectedSocket() client: AppSocket
  ) {
    const conversationId = client.data.conversationId;
    if (!conversationId) return null;

    const rows = await this.chatService.loadMessages(conversationId, 5, {
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

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody() body: { messageId: string },
    @ConnectedSocket() client: AppSocket
  ) {
    // Only admins can delete
    if (!client.data.isAdmin) {
      throw new WsException('Only admins can delete messages');
    }

    const conversationId = client.data.conversationId;
    if (!conversationId) {
      throw new WsException('Not in a conversation');
    }

    // Verify message exists in this conversation
    const message = await this.prisma.chatMessage.findFirst({
      where: {
        id: body.messageId,
        conversationId,
      },
    });

    if (!message) {
      throw new WsException('Message not found in this conversation');
    }

    // Delete it
    await this.chatService.deleteMessage(body.messageId);

    // Broadcast deletion to all users in the conversation
    this.server.to(conversationId).emit('message_deleted', { messageId: body.messageId });
  }
}
