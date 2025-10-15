import { Module } from '@nestjs/common';
import { PelangganController } from './pelanggan.controller';

@Module({
  controllers: [PelangganController]
})
export class PelangganModule {}
