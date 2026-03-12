import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { EventModule } from '@/event/event.module';

@Module({
  imports: [PrismaModule, EventModule],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
