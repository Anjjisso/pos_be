import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';  
import { StatsType } from './dto/stats-type.enum';
import { Role, OrderStatus, PaymentMethod } from '../../generated/prisma';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}


  // ===================================
  // 🔹 DASHBOARD
  // ===================================

  // =====================================================
  // ===================== PRODUK ========================
  // =====================================================

  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
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
    return this.prisma.category.findMany({ orderBy: { id: 'asc' } });
  }

  async getCategoryById(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Kategori tidak ditemukan');
    return category;
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    await this.getCategoryById(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: number) {
    await this.getCategoryById(id);
    return this.prisma.category.delete({ where: { id } });
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
  // ===================== USER (KASIR) ==================
  // =====================================================

  async createUser(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({ orderBy: { username: 'asc' } });
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return user;
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    await this.getUserById(id);
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async deleteUser(id: number) {
    await this.getUserById(id);
    return this.prisma.user.delete({ where: { id } });
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

  // ===================== USER MANAGEMENT =====================
  async listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, role: true, username: true, createdAt: true },
    });
  }

  async changeUserRole(id: number, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return this.prisma.user.update({ where: { id }, data: { role } });
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
// ===================== PRODUK TERBARU (maksimal 14 hari) =====================
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
