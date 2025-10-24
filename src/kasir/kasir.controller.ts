import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { KasirService } from './kasir.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Kasir')
@ApiBearerAuth('access-token') // 🟢 Tambahkan ini supaya Swagger tahu perlu JWT
@Controller('kasir')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('KASIR') // hanya kasir yang bisa akses
export class KasirController {
  constructor(private readonly kasirService: KasirService) {}

  @Post('orders')
  @ApiOperation({ summary: 'Kasir membuat order baru' })
  async createOrder(@Body() dto: CreateOrderDto, @Request() req) {
    return this.kasirService.createOrder(dto, req.user.id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Menampilkan histori order milik kasir yang login' })
  async getKasirHistory(@Request() req) {
    return this.kasirService.getKasirHistory(req.user.id);
  }
}
