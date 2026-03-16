import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketServer,
  WebSocketGateway,
  WsException,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket, type DefaultEventsMap } from 'socket.io';
import { ChatService } from '@/chat/chat.service';
import { randomUUID } from 'crypto';
import {
  ReqChatConversationReadDto,
  ReqChatDeleteMessageDto,
  ReqChatGetInitialHistoryDto,
  ReqChatLoadMoreHistoryDto,
  ReqChatMessagePostDto,
} from '@/chat/chat.schema';
import { ResChatMessageSchema, ReqSocketAuthSchema } from '@grit/schema';
import { ZodValidationPipe } from 'nestjs-zod';
import { ArgumentsHost, Catch, UseFilters, UsePipes, WsExceptionFilter } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { env } from '@/config/env';
import { JwtService } from '@nestjs/jwt';

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

    if (exception instanceof Error) {
      console.error('[WS ERROR]', exception.stack ?? exception.message);
    } else {
      console.error('[WS ERROR]', exception);
    }
    client.emit('error', {
      message: '404 Chat not found. You might not have access or it was deleted.',
    });
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
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // In userSockets we will store which socket belongs to which user id
  private userSockets = new Map<number, Set<string>>();

  // With the WebSocketServer decorator we get an instance of the server. This is the same as the io object from raw Socket.IO.
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService
  ) {}

  // afterInit runs ONCE when the gateway is initialized. We can install middleware in here.
  afterInit(server: Server) {
    // This registers a Socket.IO middleware. It does not run immediately but for every incoming connection attempt.
    server.use((client: AppSocket, next) => {
      const parsed_token = ReqSocketAuthSchema.safeParse(client.handshake.auth);
      if (!parsed_token.success) {
        next(new Error('Unauthorized'));
        return;
      }
      void (async () => {
        const token = parsed_token.data.token;
        let userId;
        try {
          userId = this.jwtService.verify<{ sub: number }>(token).sub;
        } catch {
          next(new Error('Unauthorized'));
          return;
        }
        if (!userId) {
          next(new Error('Unauthorized'));
          return;
        }

        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          next(new Error('Unauthorized'));
          return;
        }

        client.data.userId = user.id;
        client.data.userName = user.name;
        client.data.userAvatarKey = user.avatarKey ?? undefined;
        client.data.isAdmin = user.isAdmin;

        next();
      })();
    });
  }

  // Helper function to check that the user may read messages from a room
  private async assertUserInConversation(conversationId: string, userId: number) {
    const exists = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      select: { conversationId: true },
    });
    if (!exists) throw new WsException('User is not allowed to access this conversation');
  }

  async syncSocketConversations(socket: AppSocket, userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
        OR: [
          { event: null },
          {
            event: { isPublished: true },
          },
        ],
      },
      select: {
        id: true,
        participants: {
          where: { userId },
          select: { lastReadAt: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            conversationId: true,
            text: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                avatarKey: true,
              },
            },
          },
        },
      },
    });

    // leave old rooms
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        await socket.leave(room);
      }
    }

    // join correct rooms
    for (const conv of conversations) {
      await socket.join(conv.id);
    }

    // build payload
    const payload: Record<string, unknown> = {};

    for (const conv of conversations) {
      const participant = conv.participants[0];

      payload[conv.id] = {
        lastMessage: conv.messages[0] ?? null,
        lastReadAt: participant.lastReadAt ?? null,
      };
    }
    socket.emit('initialLastMessages', payload);
  }

  async handleConnection(client: AppSocket) {
    const userId = client.data.userId;

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }

    this.userSockets.get(userId)?.add(client.id);

    await this.syncSocketConversations(client, userId);
  }

  handleDisconnect(client: AppSocket) {
    const userId = client.data.userId;
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(client.id);

    // Fallback in any case
    if (sockets.size === 0) this.userSockets.delete(userId);
  }

  // In case an event was deleted we send a message to all users in the current chat
  async handleConversationDeletion(conversationId: string) {
    const sockets = await this.server.in(conversationId).fetchSockets();
    this.server.to(conversationId).emit('chat_deleted', 'This chat was deleted');
  }

  getSingleConnectionStatus(userId: number) {
    return this.userSockets.has(userId);
  }

  async resyncUserRooms(userId: number) {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds) return;

    for (const socketId of socketIds) {
      const socket = this.server.sockets.sockets.get(socketId) as AppSocket | undefined;
      if (!socket) continue;

      await this.syncSocketConversations(socket, userId);
    }
  }

  @SubscribeMessage('getInitialHistory')
  async handGetHistory(
    @MessageBody() body: ReqChatGetInitialHistoryDto,
    @ConnectedSocket() client: AppSocket
  ) {
    await this.assertUserInConversation(body.conversationId, client.data.userId);
    const rows = await this.chatService.loadMessages(body.conversationId);
    const history = rows.reverse();
    client.emit('initialHistory', history);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() body: ReqChatMessagePostDto,
    @ConnectedSocket() client: AppSocket
  ) {
    await this.assertUserInConversation(body.conversationId, client.data.userId);
    const { conversationId } = body;
    const id = randomUUID();
    // Emit immediately (realtime first)
    const message = ResChatMessageSchema.parse({
      id,
      conversationId,
      text: body.text,
      author: {
        id: client.data.userId,
        name: client.data.userName,
        avatarKey: client.data.userAvatarKey,
      },
      createdAt: new Date().toISOString(),
    });
    this.server.to(conversationId).emit('message', message);

    // Persist asynchronously (durability second)
    await this.chatService.saveMessage({
      id,
      conversationId,
      authorId: client.data.userId,
      text: body.text,
    });
  }

  @SubscribeMessage('loadMoreHistory')
  async handleLoadMore(
    @MessageBody() body: ReqChatLoadMoreHistoryDto,
    @ConnectedSocket() client: AppSocket
  ) {
    await this.assertUserInConversation(body.conversationId, client.data.userId);

    const rows = await this.chatService.loadMessages(body.conversationId, 15, {
      createdAt: new Date(body.cursorSentAt),
      id: body.cursorId,
    });

    if (rows.length === 0) {
      client.emit('historyEnd');
      return;
    }

    const messages = rows.reverse().map((row) =>
      ResChatMessageSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })
    );
    client.emit('moreHistory', messages);
  }

  // This is sent from client to update which conversation was read when the last time
  @SubscribeMessage('conversationRead')
  async handleNewLastReadAt(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() body: ReqChatConversationReadDto
  ) {
    await this.assertUserInConversation(body.conversationId, client.data.userId);
    const userId = client.data.userId;
    const { conversationId } = body;

    if (!conversationId) return;

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(), // backend authoritative time
      },
    });
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody() body: ReqChatDeleteMessageDto,
    @ConnectedSocket() client: AppSocket
  ) {
    // Only admins can delete
    if (!client.data.isAdmin) {
      throw new WsException('Only admins can delete messages');
    }

    // Verify user is in this conversation
    await this.assertUserInConversation(body.conversationId, client.data.userId);

    // Verify message exists in this conversation
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: body.messageId },
      select: { conversationId: true },
    });

    if (!message) {
      throw new WsException('Message not found');
    }

    if (message.conversationId !== body.conversationId) {
      throw new WsException('Message not in this conversation');
    }

    // Delete it
    await this.chatService.deleteMessage(body.messageId);

    // Broadcast deletion to all users in the conversation
    this.server.to(body.conversationId).emit('message_deleted', { messageId: body.messageId });
  }

  @SubscribeMessage('requestUserInfo')
  handleRequestUserInfo(@ConnectedSocket() client: AppSocket) {
    client.emit('user_info', { isAdmin: client.data.isAdmin });
  }
}
