import { Controller, Post, UseGuards, Body, Get, Param, Delete, Query } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';
import { FriendsService } from './friends.service';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  ReqFriendRequestDto,
  ReqFriendRequestsGetAllDto,
  ReqFriendsGetAllDto,
  ResFriendRequestDto,
  ResFriendDto,
  ResListFriendRequestDto,
  ResListFriendDto,
} from '@/friends/friends.schema';

@Controller('users/me/friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // Send a friend request
  @Post('requests')
  @ZodSerializerDto(ResFriendRequestDto)
  sendRequest(@Body() body: ReqFriendRequestDto, @GetUser('id') userId: number) {
    return this.friendsService.sendRequest(userId, body.receiverId);
  }

  // Accept a friend request
  @Post('requests/:id/accept')
  @ZodSerializerDto(ResFriendDto)
  accept(@Param('id') id: string, @GetUser('id') userId: number) {
    return this.friendsService.acceptRequest(id, userId);
  }

  // Decline a friend request
  @Post('requests/:id/decline')
  @ZodSerializerDto(ResFriendRequestDto)
  decline(@Param('id') id: string, @GetUser('id') userId: number) {
    return this.friendsService.declineRequest(id, userId);
  }

  // Delete a friend
  @Delete(':friendId')
  @ZodSerializerDto(ResFriendDto)
  remove(@Param('friendId') friendId: string, @GetUser('id') userId: number) {
    return this.friendsService.removeFriend(userId, Number(friendId));
  }

  // List incoming friend requests
  @Get('requests/incoming')
  @ZodSerializerDto(ResListFriendRequestDto)
  listIncoming(@Query() query: ReqFriendRequestsGetAllDto, @GetUser('id') userId: number) {
    return this.friendsService.listIncoming(userId, query);
  }

  // List outgoing friend requests
  @Get('requests/outgoing')
  @ZodSerializerDto(ResListFriendRequestDto)
  listOutgoing(@Query() query: ReqFriendRequestsGetAllDto, @GetUser('id') userId: number) {
    return this.friendsService.listOutgoing(userId, query);
  }

  // List friends
  @Get()
  @ZodSerializerDto(ResListFriendDto)
  listFriends(@Query() query: ReqFriendsGetAllDto, @GetUser('id') userId: number) {
    return this.friendsService.listFriends(userId, query);
  }
}
