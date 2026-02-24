import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { friendsCursorFilter, friendsEncodeCursor } from './friends.utils';
import { ReqFriendsGetAllDto, ReqFriendRequestsGetAllDto } from './friends.schema';

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

  async listIncoming(id: number, input: ReqFriendRequestsGetAllDto) {
    const cursorFilter = friendsCursorFilter(input);
    const { limit } = input;

    const requests = await this.prisma.friendRequest.findMany({
      where: { receiverId: id, ...cursorFilter },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit + 1,
    });

    const hasMore = requests.length > limit;
    const slicedData = hasMore ? requests.slice(0, limit) : requests;

    return {
      data: slicedData,
      pagination: {
        nextCursor: hasMore
          ? friendsEncodeCursor(
              slicedData[slicedData.length - 1].createdAt,
              slicedData[slicedData.length - 1].id
            )
          : null,
        hasMore,
      },
    };
  }

  async listOutgoing(id: number, input: ReqFriendRequestsGetAllDto) {
    const cursorFilter = friendsCursorFilter(input);
    const { limit } = input;

    const requests = await this.prisma.friendRequest.findMany({
      where: { requesterId: id, ...cursorFilter },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit + 1,
    });

    const hasMore = requests.length > limit;
    const slicedData = hasMore ? requests.slice(0, limit) : requests;

    return {
      data: slicedData,
      pagination: {
        nextCursor: hasMore
          ? friendsEncodeCursor(
              slicedData[slicedData.length - 1].createdAt,
              slicedData[slicedData.length - 1].id
            )
          : null,
        hasMore,
      },
    };
  }

  async listFriends(id: number, input: ReqFriendsGetAllDto) {
    const cursorFilter = friendsCursorFilter(input);
    const { limit } = input;

    const friends = await this.prisma.friends.findMany({
      where: { userId: id, ...cursorFilter },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit + 1,
    });

    const hasMore = friends.length > limit;
    const slicedData = hasMore ? friends.slice(0, limit) : friends;

    return {
      data: slicedData,
      pagination: {
        nextCursor: hasMore
          ? friendsEncodeCursor(
              slicedData[slicedData.length - 1].createdAt,
              slicedData[slicedData.length - 1].id
            )
          : null,
        hasMore,
      },
    };
  }

  async acceptRequest(id: string, userId: number) {
    // Find friend request
    const friendRequest = await this.prisma.friendRequest.findFirst({
      where: { id: id },
    });

    if (!friendRequest) {
      throw new BadRequestException('Friend request does not exist.');
    }

    if (friendRequest.receiverId !== userId) {
      throw new BadRequestException('You can only accept friend requests sent to you.');
    }

    // Create friendship for both users, and delete friend request
    const result = await this.prisma.$transaction([
      this.prisma.friends.create({
        data: {
          userId: userId,
          friendId: friendRequest.requesterId,
        },
      }),
      this.prisma.friends.create({
        data: {
          userId: friendRequest.requesterId,
          friendId: userId,
        },
      }),
      this.prisma.friendRequest.delete({
        where: { id },
      }),
    ]);

    // Return the first friendship created (for current user)
    return result[0];
  }

  async declineRequest(id: string, userId: number) {
    // Find friend request
    const friendRequest = await this.prisma.friendRequest.findFirst({
      where: { id: id },
    });

    if (!friendRequest) {
      throw new BadRequestException('Friend request does not exist.');
    }

    if (friendRequest.receiverId !== userId) {
      throw new BadRequestException('You can only decline friend requests sent to you.');
    }

    // Delete friend request
    return await this.prisma.friendRequest.delete({
      where: { id },
    });
  }

  async removeFriend(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('You can not delete yourself as a friend.');
    }

    // Find friendship
    const friendship = await this.prisma.friends.findFirst({
      where: {
        userId: userId,
        friendId: friendId,
      },
    });
    if (!friendship) throw new BadRequestException('Friendship does not exist.');

    // Delete both friendship directions
    await this.prisma.friends.deleteMany({
      where: {
        OR: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    return friendship;
  }
}
