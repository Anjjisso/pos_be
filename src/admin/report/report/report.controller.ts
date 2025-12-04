// src/admin/report/report.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { FilterReportDto } from './dto/filter-report.dto';

@Controller('admin/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // kartu ringkasan
  @Get('summary')
  getSummary(@Query() dto: FilterReportDto) {
    return this.reportService.getSummary(dto);
  }

  // grafik penjualan harian
  @Get('daily-chart')
  getDailyChart(@Query() dto: FilterReportDto) {
    return this.reportService.getDailyChart(dto);
  }

  // pie chart metode pembayaran
  @Get('payment-stats')
  getPaymentStats(@Query() dto: FilterReportDto) {
    return this.reportService.getPaymentStats(dto);
  }

  // tabel laporan transaksi
  @Get('transactions')
  getTransactions(
    @Query() dto: FilterReportDto,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reportService.getTransactions(dto, Number(page), Number(limit));
  }

@Get('yearly-sales')
getYearlySales() {
  return this.reportService.getYearlySales();
}


}
