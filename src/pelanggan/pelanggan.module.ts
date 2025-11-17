import { Module } from '@nestjs/common';
import { PelangganService } from './pelanggan.service';
import { PelangganController } from './pelanggan.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PelangganController],
  providers: [PelangganService, PrismaService],
})
export class PelangganModule {}
