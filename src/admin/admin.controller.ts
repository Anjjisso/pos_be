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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { OrderStatus, Role } from '../../generated/prisma';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth('access-token') // 🟢 Tambahkan ini agar Swagger tahu butuh token JWT
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Produk ---
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

  // --- Order ---
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

  // --- User ---
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
}
