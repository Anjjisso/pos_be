import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { OrderStatus, Role } from '../../generated/prisma';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- PRODUK CRUD ---
  @Post('products')
  @ApiOperation({ summary: 'Admin menambahkan produk baru' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Admin melihat semua produk' })
  getAllProducts() {
    return this.adminService.getAllProducts();
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Admin memperbarui produk' })
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Admin menghapus produk' })
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteProduct(id);
  }

  // --- PRODUK IMAGE (BYTES) ---
  @Post('products/:id/image')
  @ApiOperation({ summary: 'Admin menambahkan atau mengganti foto produk (disimpan dalam DB sebagai bytes)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminService.updateProductImageBytes(id, file.buffer);
  }

  @Get('products/:id/image')
  @ApiOperation({ summary: 'Melihat foto produk (dalam bentuk file image)' })
  async getProductImage(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const product = await this.adminService.getProductById(id);
    if (!product.image) return res.status(404).send('Tidak ada foto');
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(product.image);
  }

  // --- ORDER ---
  @Get('orders')
  @ApiOperation({ summary: 'Admin melihat semua order' })
  listOrders() {
    return this.adminService.listOrders();
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Admin memperbarui status order' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
  ) {
    return this.adminService.updateOrderStatus(id, status);
  }

  // --- USER ---
  @Get('users')
  @ApiOperation({ summary: 'Admin melihat daftar user' })
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Admin mengubah role user' })
  changeUserRole(@Param('id', ParseIntPipe) id: number, @Body('role') role: Role) {
    return this.adminService.changeUserRole(id, role);
  }

  // --- STATISTIK PRODUK TERLARIS ---
  @Get('stats/year')
  getTopByYear(@Query('year') year: number) {
    return this.adminService.topProductsByYear(Number(year));
  }

  @Get('stats/month')
  getTopByMonth(@Query('year') year: number, @Query('month') month: number) {
    return this.adminService.topProductsByMonth(Number(year), Number(month));
  }

  @Get('stats/week')
  getTopByWeek(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('week') week: number,
  ) {
    return this.adminService.topProductsByWeek(Number(year), Number(month), Number(week));
  }
}
