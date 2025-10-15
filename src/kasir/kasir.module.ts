import { Module } from '@nestjs/common';
import { KasirService } from './kasir.service';
import { KasirController } from './kasir.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [KasirController],
  providers: [KasirService, PrismaService],
})
export class KasirModule {}
