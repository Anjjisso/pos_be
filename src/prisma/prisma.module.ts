import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // biar PrismaService bisa dipakai di semua module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
