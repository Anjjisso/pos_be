import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { PelangganService } from './pelanggan.service';
import { CreatepesananPelangganDto } from './dto/create-pesanan-pelanggan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('customer')
export class PelangganController {
  constructor(private readonly customerService: PelangganService) {}

  @Get('products')
  getProducts() {
    return this.customerService.getProducts();
  }

  // ✅ Pelanggan buat pesanan (butuh login)

  @Post('order')
createOrder(@Body() dto: CreatepesananPelangganDto) {
  return this.customerService.createOrder(dto);
}


  // ✅ Cek pesanan lewat barcode
  @Get('order/:barcode')
  getOrderByBarcode(@Param('barcode') barcode: string) {
    return this.customerService.getOrderByBarcode(barcode);
  }
}
