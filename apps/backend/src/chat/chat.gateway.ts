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
import { ResChatMessageSchema, ReqSocketAuthSchema, JoinType } from '@grit/schema';
import 'socket.io';
import type { DefaultEventsMap } from 'socket.io';
import { ConversationService } from '@/conversation/conversation.service';

interface SocketData {
  userId: number;
  userName: string;
  userAvatarKey?: string;
  conversationId?: string;
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
  async handleJoin(
    @MessageBody() body: ReqChatJoinSchemaDto,
    @ConnectedSocket() client: AppSocket
  ) {
    console.log('Join message received for ', body.joinType);

    // If this is a join request for an event we might first need to create the conversation
    if (body.joinType === JoinType.EVENT) {
      const res = await this.conversation.getOrCreateEventConversation(body.eventId);

      // Check if the client is allowed to join the chat room
      const userIsAttendingEvent = await this.userService.userIsAttendingEvent(
        client.data.userId,
        body.eventId
      );
      if (!userIsAttendingEvent) {
        client.disconnect();
        return 0;
      }

      // Join the conversation (room) that belongs to the event
      await client.join(`conversation:${res.id}`);

      // We lock down which conversation (room) this socket belongs to
      client.data.conversationId = res.id;

      // Get message history to prefill chat
      const rows = await this.chatService.loadMessages(res.id);
      // Serialization in Websocket context
      const history = rows.reverse().map((row) => ResChatMessageSchema.parse(row));
      client.emit('history', history);
    } else {
      console.log('No event provided');
    }
  }

  // @SubscribeMessage('message')
  // async handleMessage(
  //   @MessageBody() body: ReqChatMessagePostDto,
  //   @ConnectedSocket() client: AppSocket
  // ) {
  //   const eventId = client.data.eventId;
  //   // Client must have joined an event room
  //   if (!eventId) {
  //     client.disconnect();
  //     return null;
  //   }
  //   const id = randomUUID();

  //   // Emit immediately (realtime first)
  //   const res = {
  //     id,
  //     eventId,
  //     text: body.text,
  //     author: {
  //       id: client.data.userId,
  //       name: client.data.userName,
  //       avatarKey: client.data.userAvatarKey,
  //     },
  //     createdAt: new Date(),
  //   };
  //   const message = ResChatMessageSchema.parse(res);
  //   this.server.to(`event:${String(eventId)}`).emit('message', message);

  //   // Persist asynchronously (durability second)
  //   await this.chatService.saveMessage({
  //     id,
  //     eventId,
  //     authorId: client.data.userId,
  //     text: body.text,
  //   });
  // }

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
