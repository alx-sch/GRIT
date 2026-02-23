import { Controller, Post, UseGuards, Body, Get, Param, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { GetUser } from '@/auth/guards/get-user.decorator';
import { FriendsService } from './friends.service';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  ReqFriendRequestDto,
  ResFriendRequestDto,
  ResListFriendRequestDto,
  ReqFriendActionDto,
  ResFriendDto,
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

  // List incoming friend requests
  @Get('requests/incoming')
  @ZodSerializerDto(ResListFriendRequestDto)
  incoming(@GetUser('id') userId: number) {
    return this.friendsService.listIncoming(userId);
  }

  // List outgoing friend requests
  @Get('requests/outgoing')
  @ZodSerializerDto(ResListFriendRequestDto)
  outgoing(@GetUser('id') userId: number) {
    return this.friendsService.listOutgoing(userId);
  }
}
