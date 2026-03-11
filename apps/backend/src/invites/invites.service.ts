import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatGateway } from '@/chat/chat.gateway';
import { InviteStatus } from '@grit/schema';

@Injectable()
export class InvitesService {
  constructor(
    private prisma: PrismaService,
    private readonly chatGateway: ChatGateway
  ) {}

  async sendInvite(userId: number, receiverId: number, eventId: number) {}
  async updateInvite(id: string, userId: number, status: InviteStatus) {}
  async listIncoming(userId: number) {}
  async listOutgoing(userId: number) {}
}
