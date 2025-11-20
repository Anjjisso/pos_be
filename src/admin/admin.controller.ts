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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateProductUnitDto } from './dto/create-product-unit.dto';
import { UpdateProductUnitDto } from './dto/update-product-unit.dto';
import { StatsType } from './dto/stats-type.enum';
import { OrderStatus, Role } from '../../generated/prisma';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}


  // ===================================
  // 🔹 DATA MASTER
  // ===================================
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

// ================================
  // 🔹 CREATE PRODUCT UNIT
  // ================================
  @Post()
  create(@Body() dto: CreateProductUnitDto) {
    return this.adminService.createProductUnit(dto);
  }

  // ================================
  // 🔹 GET UNITS BY PRODUCT ID
  // ================================
  @Get('productId')
  getUnitsByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.adminService.getUnitsByProduct(productId);
  }

  // ================================
  // 🔹 GET PRODUCT UNIT BY ID
  // ================================
  @Get('unit/unitId')
  getUnitById(@Param('unitId', ParseIntPipe) unitId: number) {
    return this.adminService.getUnitById(unitId);
  }

  // ================================
  // 🔹 UPDATE PRODUCT UNIT
  // ================================
  @Patch('unitId')
  update(
    @Param('unitId', ParseIntPipe) unitId: number,
    @Body() dto: UpdateProductUnitDto,
  ) {
    return this.adminService.updateProductUnit(unitId, dto);
  }

  // ================================
  // 🔹 DELETE PRODUCT UNIT
  // ================================
  @Delete('unitId')
  delete(@Param('unitId', ParseIntPipe) unitId: number) {
    return this.adminService.deleteProductUnit(unitId);
  }


// --- KATEGORI ---
@Post('categories')
createCategory(@Body() dto: CreateCategoryDto) {
  return this.adminService.createCategory(dto);
}

@Get('categories')
getAllCategories() {
  return this.adminService.getAllCategories();
}

@Patch('categories/:id')
updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
  return this.adminService.updateCategory(id, dto);
}

@Delete('categories/:id')
deleteCategory(@Param('id', ParseIntPipe) id: number) {
  return this.adminService.deleteCategory(id);
}

// --- SUPPLIER ---
@Post('suppliers')
createSupplier(@Body() dto: CreateSupplierDto) {
  return this.adminService.createSupplier(dto);
}

@Get('suppliers')
getAllSuppliers() {
  return this.adminService.getAllSuppliers();
}

@Patch('suppliers/:id')
updateSupplier(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSupplierDto) {
  return this.adminService.updateSupplier(id, dto);
}

@Delete('suppliers/:id')
deleteSupplier(@Param('id', ParseIntPipe) id: number) {
  return this.adminService.deleteSupplier(id);
}

@Get('payment-methods')
@ApiOperation({ summary: 'Lihat daftar metode pembayaran (enum)' })
listPaymentMethods() {
  return this.adminService.listPaymentMethods();
}



  // ===================================
  // 🔹 DASHBOARD
  // ===================================

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



  // --- DOWNLOAD ORDER EXCEL ---
  @Get('orders/excel')
  async downloadOrdersExcel(@Res() res: Response) {
    const orders = await this.adminService.listOrders();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Daftar Order');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Kode Transaksi', key: 'transactionId', width: 20 },
      { header: 'Tanggal', key: 'createdAt', width: 20 },
      { header: 'Kasir', key: 'cashierName', width: 20 },
      { header: 'Total Item', key: 'totalItem', width: 12 },
      { header: 'Total Harga (Rp)', key: 'totalPrice', width: 18 },
      { header: 'Metode Pembayaran', key: 'paymentMethod', width: 20 },
    ];

    orders.forEach((o) => {
      sheet.addRow({
        ...o,
        createdAt: new Date(o.createdAt).toLocaleString('id-ID'),
        totalPrice: o.totalPrice.toLocaleString('id-ID'),
      });
    });

    // Gaya header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }

  // --- DOWNLOAD ORDER PDF ---
  @Get('orders/pdf')
  async downloadOrdersPdf(@Res() res: Response) {
    const orders = await this.adminService.listOrders();

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.pdf');
    doc.pipe(res);

    // Judul
    doc.fontSize(18).text('Daftar Order (Transaksi)', { align: 'center' });
    doc.moveDown();

    // Header kolom
    doc.fontSize(12).text(
      'No | Kode Transaksi | Kasir | Tanggal | Total Item | Total Harga | Pembayaran',
      { underline: true },
    );
    doc.moveDown(0.5);

    // Isi data
    orders.forEach((o) => {
      doc.fontSize(11).text(
        `${o.no}. ${o.transactionId} | ${o.cashierName} | ${new Date(
          o.createdAt,
        ).toLocaleString('id-ID')} | ${o.totalItem} | Rp${o.totalPrice.toLocaleString(
          'id-ID',
        )} | ${o.paymentMethod}`,
      );
    });

    doc.end();
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

  
  // 📌 Statistik Tahunan
@Get('stats')
@ApiQuery({ name: 'type', enum: StatsType })
@ApiQuery({ name: 'years', isArray: true, type: Number })
async getStats(
  @Query('type') type: StatsType,
  @Query('years') years: string[],
) {
  const parsedYears = years.map(Number);
  return this.adminService.getStats(type, parsedYears);
}


@Get('dashboard/:year')
dashboardStats(@Param('year') year: string) {
  return this.adminService.dashboardStatsByYear(Number(year));
}

// 📌 Leaderboard Produk Terlaris
@Get('products/stats')
async getProductStats() {
  return this.adminService.productStats();
}

@Get('products/leaderboard')
async getTopProducts() {
  return this.adminService.topProductsLeaderboard();
}

@Get('products/leaderboard/excel')
  async downloadLeaderboardExcel(@Res() res: Response) {
    const data = await this.adminService.topProductsLeaderboard();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Top Produk');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Produk', key: 'name', width: 25 },
      { header: 'Terjual', key: 'sold', width: 10 },
      { header: 'Total Harga', key: 'totalPrice', width: 15 },
      { header: 'Persentase (%)', key: 'percentage', width: 15 },
    ];

    data.forEach((item) => sheet.addRow(item));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=leaderboard.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }

  // --- DOWNLOAD PDF ---
  @Get('products/leaderboard/pdf')
  async downloadLeaderboardPdf(@Res() res: Response) {
    const data = await this.adminService.topProductsLeaderboard();

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=leaderboard.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Top Produk Terlaris', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12);
    data.forEach((item) => {
      doc.text(
        `${item.no}. ${item.name} - ${item.sold}x terjual (Rp${item.totalPrice}) - ${item.percentage}%`,
      );
    });

    doc.end();
  }

@Get('products/latest')
async latestProducts() {
  return this.adminService.latestProducts();
}



}
