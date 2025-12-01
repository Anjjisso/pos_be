import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { KasirService } from './kasir.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Kasir')
@ApiBearerAuth('access-token') // memberi tahu Swagger bahwa butuh token
@Controller('kasir')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('KASIR') // membatasi hanya role kasir
export class KasirController {
  constructor(private readonly kasirService: KasirService) {}

  // =========================
  //  ✔ CREATE ORDER
  // =========================
  @Post('orders')
  @ApiOperation({ summary: 'Kasir membuat order baru' })
  async createOrder(@Body() dto: CreateOrderDto, @Request() req) {
    return this.kasirService.createOrder(dto, req.user.id);
  }

  // =========================
  //  ✔ SEARCH PRODUCTS
  // =========================
 @Get('search')
searchProducts(@Query('q') q?: string) {
  return this.kasirService.searchProducts(q);
}

@Get('by-category')
getByCategory(@Query('category') category?: string) {
  return this.kasirService.getProductsByCategory(category);
}



  // =========================
  //  ✔ GET HISTORY ORDER KASIR
  // =========================
  @Get('orders')
  @ApiOperation({ summary: 'Menampilkan histori order milik kasir yang login' })
  async getKasirHistory(@Request() req) {
    return this.kasirService.getKasirHistory(req.user.id);
  }
}
