import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Only import PrimsaModule once in AppModule
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
