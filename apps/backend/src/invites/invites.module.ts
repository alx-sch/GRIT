import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';

@Module({
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
