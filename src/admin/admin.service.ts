import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateProductUnitDto } from './dto/create-product-unit.dto';
import { UpdateProductUnitDto } from './dto/update-product-unit.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';  
import { StatsType } from './dto/stats-type.enum';
import { Role, OrderStatus, PaymentMethod, UserStatus } from '../../generated/prisma';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common/exceptions';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}


  // ===================================
  // 🔹 DATA MASTER
  // ===================================

  // =====================================================
  // ===================== PRODUK ========================
  // =====================================================

  async createProduct(dto: CreateProductDto) {
  // Ambil produk terakhir untuk generate kode baru
  const last = await this.prisma.product.findFirst({
    orderBy: { id: 'desc' },
  });

  const nextNumber = (last?.id ?? 0) + 1;
  const productCode = `NUKA-${String(nextNumber).padStart(4, '0')}`;

  return this.prisma.product.create({
    data: {
      productCode: productCode,
      name: dto.name,
      price: dto.price,
      costPrice: dto.costPrice,
      stock: dto.stock,
      description: dto.description,
      barcode: dto.barcode,
      categoryId: dto.categoryId,
      supplierId: dto.supplierId,
    },
  });
}

async getTotalProductsCount() {
    return this.prisma.product.count();
  }

  async getAllProducts() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true, supplier: true },
    });
  }
 
  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }

// ===================== EXPORT PRODUK (CSV & COPY) =====================
async exportProductsToCsv(): Promise<string> {
  const products = await this.prisma.product.findMany({
    orderBy: { id: 'asc' },
    include: {
      category: true,
      supplier: true,
    },
  });

  const header = [
    'ID',
    'Gambar Produk',
    'Kode Produk',
    'Barcode',
    'Nama Produk',
    'Kategori',
    'Supplier',
    'Harga Jual',
    'Stok'
  ];

  const rows = products.map((p) => [
    p.id,
    p.image ? 'Ada Gambar' : 'Tidak ada Gambar',
    p.productCode ?? '',
    p.barcode ?? '',
    p.name ?? '',
    p.category?.name ?? '',
    p.supplier?.name ?? '',
    p.price ?? 0,
    p.stock ?? 0,
  ]);

  const csvLines = [
    header.join(','),
    ...rows.map((r) => r.join(',')),
  ];

  return csvLines.join('\n');
}


  async updateProduct(id: number, dto: UpdateProductDto) {
    await this.getProductById(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async deleteProduct(id: number) {
    await this.getProductById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async updateProductImageBytes(id: number, buffer: Buffer) {
    await this.getProductById(id);
    return this.prisma.product.update({
      where: { id },
      data: { image: buffer },
    });
  }

  // =====================================================
  // ===================== KATEGORI ======================
  // =====================================================

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async getAllCategories() {
  return this.prisma.category.findMany({
    orderBy: { id: 'asc' },
    include: {
      _count: {
        select: { products: true }, // jumlah produk dalam kategori ini
      },
    },
  });
}

async getTotalCategoriesCount() {
    return this.prisma.category.count();
  }

  async getCategoryById(id: number) {
  const category = await this.prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) throw new NotFoundException('Kategori tidak ditemukan');
  return category;
}

// ===================== EXPORT PRODUK (CSV & COPY) =====================
async exportCategoriesToCsv(): Promise<string> {
  const category = await this.prisma.category.findMany({
    orderBy: { id: 'asc' },
  });

  const header = [
    'ID',
    'Gambar Kategori',
    'Nama Kategori',
    'Dibuat Pada',
    
  ];

  const rows = category.map((c) => [
    c.id ?? '',
    c.image ? 'Ada Gambar' : 'Tidak ada Gambar',
    c.name ?? '',
    c.createdAt?.toISOString() ?? '',
  ]);

  const csvLines = [
    header.join(','),
    ...rows.map((r) => r.join(',')),
  ];

  return csvLines.join('\n');
}


  async updateCategory(id: number, dto: UpdateCategoryDto) {
    await this.getCategoryById(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: number) {
    await this.getCategoryById(id);
    return this.prisma.category.delete({ where: { id } });
  }

async updateCategoryImageBytes(id: number, buffer: Buffer) {
    await this.getCategoryById(id);
    return this.prisma.category.update({
      where: { id },
      data: { image: buffer },
    });
  }

// =====================================================
// ===================== PRODUCT UNIT ===================
// =====================================================

async createProductUnit(dto: CreateProductUnitDto) {
  // Pastikan produk ada
  const product = await this.prisma.product.findUnique({
    where: { id: dto.productId },
  });
  if (!product) throw new NotFoundException('Produk tidak ditemukan');

  const multiplier = dto.multiplier ?? 1;

  // 💰 harga unit = harga per PCS × jumlah PCS per unit
  const unitPrice = product.price * multiplier;

  return this.prisma.productUnit.create({
    data: {
      productId: dto.productId,
      unitName: dto.unitName,
      multiplier,
      price: unitPrice, // ✅ otomatis, tidak dari input user
    },
  });
}

async getUnitsByProduct(productId: number) {
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) throw new NotFoundException('Produk tidak ditemukan');

  return this.prisma.productUnit.findMany({
    where: { productId },
    orderBy: { multiplier: 'asc' },
  });
}

async getUnitById(unitId: number) {
  const unit = await this.prisma.productUnit.findUnique({
    where: { id: unitId },
  });
  if (!unit) throw new NotFoundException('Satuan tidak ditemukan');
  return unit;
}

async getTotalProductUnitsCount() {
  return this.prisma.productUnit.count();
}

// ===================== EXPORT PRODUK UNIT (CSV) =====================
async exportProductUnitToCsv(): Promise<string> {
  const unit = await this.prisma.productUnit.findMany({
    orderBy: { id: 'asc' },
    include: {
      product: true,
    },
  });

  const header = [
    'ID',
    'Produk',
    'Nama Satuan',
    'Pcs per Satuan',
    'Harga Jual per Unit',
  ];

  const rows = unit.map((u) => [
    u.id,
    u.product?.name ?? '',
    u.unitName ?? '',
    u.multiplier ?? 1,
    u.price ?? 0, // ✅ ini harga per unit (Dus/Pack)
  ]);

  const csvLines = [header.join(','), ...rows.map((r) => r.join(','))];

  return csvLines.join('\n');
}

async updateProductUnit(unitId: number, dto: UpdateProductUnitDto) {
  const existingUnit = await this.getUnitById(unitId);

  // Ambil produk dari unit
  const product = await this.prisma.product.findUnique({
    where: { id: existingUnit.productId },
  });
  if (!product) throw new NotFoundException('Produk tidak ditemukan');

  // Kalau multiplier baru tidak dikirim, pakai yang lama
  const newMultiplier =
    dto.multiplier !== undefined ? dto.multiplier : existingUnit.multiplier;

  // 💰 hitung ulang harga unit
  const unitPrice = product.price * newMultiplier;

  return this.prisma.productUnit.update({
    where: { id: unitId },
    data: {
      unitName: dto.unitName ?? existingUnit.unitName,
      multiplier: newMultiplier,
      price: unitPrice, // ✅ tetap ikut harga product
    },
  });
}

async deleteProductUnit(unitId: number) {
  await this.getUnitById(unitId);
  return this.prisma.productUnit.delete({
    where: { id: unitId },
  });
}


  // =====================================================
  // ===================== SUPPLIER ======================
  // =====================================================

  async createSupplier(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async getAllSuppliers() {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  async getSupplierById(id: number) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier tidak ditemukan');
    return supplier;
  }

  async getTotalSuppliersCount() {
    return this.prisma.supplier.count();
  }

  async updateSupplier(id: number, dto: UpdateSupplierDto) {
    await this.getSupplierById(id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async deleteSupplier(id: number) {
    await this.getSupplierById(id);
    return this.prisma.supplier.delete({ where: { id } });
  }

  // =====================================================
  // ===================== PEMBAYARAN ====================
  // =====================================================

  async listPaymentMethods() {
    return Object.values(PaymentMethod);
  }

  // ✅ Tidak perlu create/update/delete karena enum tidak bisa dimodifikasi
  async createPaymentMethod() {
    throw new Error('Payment methods are predefined in the enum and cannot be created manually.');
  }

  async updatePaymentMethod() {
    throw new Error('Payment methods are predefined in the enum and cannot be updated.');
  }

  async deletePaymentMethod() {
    throw new Error('Payment methods are predefined in the enum and cannot be deleted.');
  }

  // =====================================================
  // ===================== USER MANAGEMENT ==============
  // =====================================================
  async createUser(dto: CreateUserDto) {
    // Cek email unik
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('Email sudah dipakai');

    // Hash password
    const hashed = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashed,
        role: dto.role,
        status: UserStatus.AKTIF,
      },
    });
  }

  // =============== GET ALL ===============
  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { username: 'asc' },
    });
  }

  // =============== GET BY ID ===============
  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return user;
  }

  async getTotalUsersCount() {
    return this.prisma.user.count();
  }

  // ===================== EXPORT PRODUK (CSV & COPY) =====================
async exportUsersToCsv(): Promise<string> {
  const user = await this.prisma.user.findMany({
    orderBy: { id: 'asc' },
  });

  const header = [
    'No',
    'Username',
    'Email',
    'Role',
    'Dibuat Pada',
    'Status',
  ];

  const rows = user.map((u) => [
    u.id,
    u.username ?? '',
    u.email ?? '',
    u.role ?? '',
    u.createdAt?.toISOString() ?? '',
    u.status ?? '',

  ]);

  const csvLines = [
    header.join(','),
    ...rows.map((r) => r.join(',')),
  ];

  return csvLines.join('\n');
}

  // =============== UPDATE ===============
  async updateUser(id: number, dto: UpdateUserDto) {
    await this.getUserById(id); // validasi id

    const updateData: any = {
      email: dto.email,
      username: dto.username,
      role: dto.role,
      status: dto.status,
    };

    // Kalau password ikut di-update, hash ulang
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  // =============== DELETE ===============
  async deleteUser(id: number) {
    await this.getUserById(id); // validasi
    return this.prisma.user.delete({ where: { id } });
  }

  // =============== AUTO-DEACTIVATE USERS ===============
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deactivateInactiveUsers() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    await this.prisma.user.updateMany({
      where: {
        lastLogin: { lt: oneMonthAgo },
        status: UserStatus.AKTIF,
      },
      data: { status: UserStatus.TIDAK_AKTIF },
    });
  }

  // =====================================================
  // ===================== ORDER =========================
  // =====================================================

  async listOrders() {
    const orders = await this.prisma.order.findMany({
      select: {
        id: true,
        createdAt: true,
        paymentMethod: true,
        user: { select: { username: true } },
        items: {
          select: {
            quantity: true,
            product: { select: { price: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return orders.map((order, index) => {
      const totalItem = order.items.reduce((t, i) => t + i.quantity, 0);
      const totalPrice = order.items.reduce(
        (t, i) => t + i.quantity * (i.product?.price ?? 0),
        0,
      );

      const created = new Date(order.createdAt);
      const trxCode = `TRX${created.getFullYear()}${String(
        created.getMonth() + 1,
      ).padStart(2, '0')}${String(created.getDate()).padStart(2, '0')}${String(
        order.id,
      ).padStart(4, '0')}`;

      return {
        no: index + 1,
        transactionId: trxCode,
        createdAt: order.createdAt,
        cashierName: order.user.username,
        totalItem,
        totalPrice,
        paymentMethod: order.paymentMethod,
        actionId: order.id,
      };
    });
  }

  async updateOrderStatus(id: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return this.prisma.order.update({ where: { id }, data: { status } });
  }


  // ===================================
  // 🔹 DASHBOARD
  // ===================================

// --- AMBIL DATA SEMUA ORDER ---
async allOrders() {
  return this.prisma.order.findMany({
    include: {
      user: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

  
  // ===================== STATISTIK =====================
  async getStats(type: StatsType, years: number[]) {
    const result: {
      year: number;
      totalYear: number;
      months: { month: number; value: number }[];
    }[] = [];

    for (const year of years) {
      const months: { month: number; value: number }[] = [];
      let totalYear = 0;

      for (let month = 1; month <= 12; month++) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);

        let value = 0;

        if (type === StatsType.REVENUE) {
          const agg = await this.prisma.order.aggregate({
            where: { createdAt: { gte: start, lt: end } },
            _sum: { total: true },
          });
          value = agg._sum.total ?? 0;
        } else if (type === StatsType.TRANSACTIONS) {
          value = await this.prisma.order.count({
            where: { createdAt: { gte: start, lt: end } },
          });
        } else if (type === StatsType.ITEMS_SOLD) {
          const agg = await this.prisma.orderItem.aggregate({
            where: { order: { createdAt: { gte: start, lt: end } } },
            _sum: { quantity: true },
          });
          value = agg._sum.quantity ?? 0;
        }

        months.push({ month, value });
        totalYear += value;
      }

      result.push({ year, totalYear, months });
    }

    return { type, years: result };
  }

  // ===================== DASHBOARD =====================
  async dashboardStatsByYear(year: number) {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year + 1}-01-01`);

    const totalItem = await this.prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: { status: 'COMPLETED', createdAt: { gte: start, lt: end } },
      },
    });

    const totalTransaksi = await this.prisma.order.count({
      where: { status: 'COMPLETED', createdAt: { gte: start, lt: end } },
    });

    const totalPemasukan = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: { status: 'COMPLETED', createdAt: { gte: start, lt: end } },
    });

    const totalPelanggan = await this.prisma.user.count({
      where: { role: 'PELANGGAN', createdAt: { gte: start, lt: end } },
    });

    // ✅ Statistik metode pembayaran (Pie Chart)
    const paymentStats = await this.prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: { paymentMethod: true },
      where: { createdAt: { gte: start, lt: end }, status: 'COMPLETED' },
    });

    const paymentMethodStats = paymentStats.map((item) => ({
      method: item.paymentMethod,
      count: item._count.paymentMethod,
      percentage: Number(
        ((item._count.paymentMethod /
          paymentStats.reduce((t, i) => t + i._count.paymentMethod, 0)) *
          100).toFixed(2),
      ),
    }));

    return {
      year,
      totalItemTerjual: totalItem._sum.quantity || 0,
      totalTransaksi,
      totalPemasukan: totalPemasukan._sum.total || 0,
      totalPelanggan,
      paymentMethodStats,
    };
  }

  // ===================== TOP PRODUK & PIE CHART =====================
  async topProductsLeaderboard() {
    const top = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    if (!top.length) return [];

    const totalAgg = await this.prisma.orderItem.aggregate({
      _sum: { quantity: true },
    });
    const totalAll = totalAgg._sum.quantity ?? 0;

    const products = await this.prisma.product.findMany({
      where: { id: { in: top.map(t => t.productId) } },
      select: { id: true, name: true, price: true },
    });

    const map = new Map(products.map(p => [p.id, p]));

    return top.map((item, index) => {
      const product = map.get(item.productId);
      const sold = item._sum.quantity ?? 0;
      const totalPrice = sold * (product?.price ?? 0);
      const percentage = totalAll > 0 ? Number(((sold / totalAll) * 100).toFixed(2)) : 0;

      return {
        no: index + 1,
        productId: item.productId,
        name: product?.name ?? 'Unknown',
        sold,
        totalPrice,
        percentage,
      };
    });
  }

  // ✅ Versi khusus untuk Pie Chart
  async topProductsPieChart() {
    const top = await this.topProductsLeaderboard();
    return top.map(p => ({
      name: p.name,
      value: p.percentage,
    }));
  }

  // ===================== PRODUK STATS =====================
  async productStats() {
    const stats = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
    });

    if (!stats.length) {
      return {
        totalSold: 0,
        totalRevenue: 0,
        topProduct: null,
        lowestProduct: null,
        averageSold: 0,
      };
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: stats.map(s => s.productId) } },
      select: { id: true, name: true, price: true },
    });

    const map = new Map(products.map(p => [p.id, p]));

    let totalSold = 0;
    let totalRevenue = 0;

    const result = stats.map(s => {
      const product = map.get(s.productId);
      const sold = s._sum.quantity ?? 0;
      const revenue = sold * (product?.price ?? 0);
      totalSold += sold;
      totalRevenue += revenue;
      return {
        productId: s.productId,
        name: product?.name ?? 'Unknown',
        sold,
        revenue,
      };
    });

    const sorted = result.sort((a, b) => b.sold - a.sold);

    return {
      totalSold,
      totalRevenue,
      topProduct: sorted[0],
      lowestProduct: sorted[sorted.length - 1],
      averageSold: Number((totalSold / result.length).toFixed(2)),
    };
  }

// ===================== PRODUK TERBARU =====================
// ===================== PRODUK TERBARU (maksimal 14 hari) ==
async latestProducts(limit = 10) {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); 

  // Ambil produk yang ditambahkan dalam 14 hari terakhir
  return this.prisma.product.findMany({
    where: { createdAt: { gte: twoWeeksAgo } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      image: true,
      createdAt: true,
    },
  });
}



// ===================== PRODUK OTOMATIS DIHAPUS =====================
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async deleteOldProducts() {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const deleted = await this.prisma.product.deleteMany({
    where: { createdAt: { lt: twoWeeksAgo } },
  });

  if (deleted.count > 0) {
    console.log(`🧹 ${deleted.count} produk dihapus karena lebih dari 14 hari.`);
  }
}



}
