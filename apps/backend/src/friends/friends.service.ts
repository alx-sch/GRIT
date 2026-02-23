import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '@/user/user.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(requesterId: number, receiverId: number) {
    // Prevent sending request to self
    if (requesterId === receiverId) {
      throw new BadRequestException('You cannot send a friend request to yourself.');
    }

    // Checking if friend request receiver exists
    const userExist = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!userExist) {
      throw new BadRequestException('Friend request receiver does not exist.');
    }

    // Check if a friend request already exists (incoming or outgoing)
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });

    if (existingRequest) {
      throw new BadRequestException('A friend request already exists between these users.');
    }

    // Check if users are already friends
    const alreadyFriends = await this.prisma.friends.findFirst({
      where: {
        OR: [
          { userId: requesterId, friendId: receiverId },
          { userId: receiverId, friendId: requesterId },
        ],
      },
    });

    if (alreadyFriends) {
      throw new BadRequestException('You are already friends with this user.');
    }

    // Create the friend request
    const friendRequest = await this.prisma.friendRequest.create({
      data: {
        requesterId,
        receiverId,
      },
    });

    return friendRequest;
  }

  async listIncoming(id: number) {
    const data = await this.prisma.friendRequest.findMany({
      where: { receiverId: id },
    });
    return { data };
  }

  async listOutgoing(id: number) {
    const data = await this.prisma.friendRequest.findMany({
      where: { requesterId: id },
    });
    return { data };
  }
}
