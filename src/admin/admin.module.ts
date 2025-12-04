// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ReportController } from './report/report/report.controller';
import { ReportService } from './report/report/report.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, ReportController],
  providers: [AdminService, ReportService],
})
export class AdminModule {}
