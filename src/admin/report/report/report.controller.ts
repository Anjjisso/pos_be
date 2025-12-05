import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ReportService } from './report.service';
import { FilterReportDto } from './dto/filter-report.dto';

@Controller('admin/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // -------------------------------------------
  // 1. SUMMARY
  // -------------------------------------------
  @Get('summary')
  getSummary(@Query() dto: FilterReportDto) {
    return this.reportService.getSummary(dto);
  }

  // -------------------------------------------
  // 2. DAILY SALES GRAPH
  // -------------------------------------------
  @Get('daily-chart')
  getDailyChart(@Query() dto: FilterReportDto) {
    return this.reportService.getDailyChart(dto);
  }

  // -------------------------------------------
  // 3. PAYMENT METHOD STATS
  // -------------------------------------------
  @Get('payment-stats')
  getPaymentStats(@Query() dto: FilterReportDto) {
    return this.reportService.getPaymentStats(dto);
  }

  // -------------------------------------------
  // 4. TRANSACTIONS TABLE (search + pagination)
  // -------------------------------------------
  @Get('transactions')
  getTransactions(
    @Query() dto: FilterReportDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reportService.getTransactions(dto, page, limit);
  }

  // -------------------------------------------
  // 5. SALES PER PRODUCT
  // -------------------------------------------
  @Get('sales-per-product')
  getSalesPerProduct(@Query() dto: FilterReportDto) {
    return this.reportService.getSalesPerProduct(dto);
  }

  // -------------------------------------------
  // 6. SALES PER CASHIER
  // -------------------------------------------
  @Get('sales-per-cashier')
  getSalesPerCashier(@Query() dto: FilterReportDto) {
    return this.reportService.getSalesPerCashier(dto);
  }

  // -------------------------------------------
  // 7. SALES PER CATEGORY
  // -------------------------------------------
  @Get('sales-per-category')
  getSalesPerCategory(@Query() dto: FilterReportDto) {
    return this.reportService.getSalesPerCategory(dto);
  }

  // -------------------------------------------
  // 8. YEARLY SALES GRAPH
  // -------------------------------------------
  @Get('yearly-sales')
  getYearlySales() {
    return this.reportService.getYearlySales();
  }
}
