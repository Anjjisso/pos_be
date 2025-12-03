// src/profile/profile.module.ts
import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],           // kalau ProfileService pakai PrismaService
  controllers: [ProfileController],  // daftarkan controllernya
  providers: [ProfileService],       // daftarkan servicenya
  exports: [ProfileService],         // kalau mau dipakai modul lain
})
export class ProfileModule {}
