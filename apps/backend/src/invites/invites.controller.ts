import { Controller, Post, UseGuards, Body, Get, Param, Delete, Query } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { GetUser } from '@/auth/guards/get-user.decorator';
import { ZodSerializerDto } from 'nestjs-zod';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  ReqInviteDto, // Invite
  ReqUpdateInviteDto, // Accept/decline
  ResInviteDto, // Response -> single
  ResListInvitesDto, // Response -> get all
} from '@/invites/invites.schema';

@Controller('users/me/invites')
@UseGuards(JwtAuthGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  // Send an event invite
  @Post()
  @ZodSerializerDto(ResInviteDto)
  sendInvite(@Body() body: ReqInviteDto, @GetUser('id') senderId: number) {
    return this.invitesService.sendInvite(senderId, body.receiverId, body.eventId);
  }

  // Update an event invite (accept or decline)
  @Post(':id')
  @ZodSerializerDto(ResInviteDto)
  updateInvite(
    @Body() body: ReqUpdateInviteDto,
    @Param('id') id: string,
    @GetUser('id') userId: number
  ) {
    return this.invitesService.updateInvite(id, userId, body.status);
  }

  // Delete an event invite (nice to have, currently not used)
  @Delete(':id')
  @ZodSerializerDto(ResInviteDto)
  deleteInvite(@Param('id') id: string, @GetUser('id') userId: number) {
    return this.invitesService.deleteInvite(id, userId);
  }

  // List incoming event invites
  @Get('incoming')
  @ZodSerializerDto(ResListInvitesDto)
  listIncoming(
    @GetUser('id') userId: number,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    return this.invitesService.listIncoming(userId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  // List outgoing event invites
  @Get('outgoing')
  @ZodSerializerDto(ResListInvitesDto)
  listOutgoing(
    @GetUser('id') userId: number,
    @Query('eventId') idOrSlug?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string
  ) {
    return this.invitesService.listOutgoing(userId, idOrSlug, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }
}
