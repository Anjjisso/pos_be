import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StatsType } from './dto/stats-type.enum';
import { Role, OrderStatus } from '../../generated/prisma';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // --- PRODUK ---
  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async getAllProducts() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async deleteProduct(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return this.prisma.product.delete({ where: { id } });
  }

  // --- FOTO PRODUK (BYTES) ---
  async updateProductImageBytes(id: number, buffer: Buffer) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');

    return this.prisma.product.update({
      where: { id },
      data: { image: buffer },
    });
  }

  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }

  // --- ORDER ---
async listOrders() {
  const orders = await this.prisma.order.findMany({
    select: {
      id: true,
      createdAt: true,
      paymentMethod: true,
      user: {
        select: {
          username: true,
        },
      },
      items: {
        select: {
          quantity: true,
          product: {
            select: {
              price: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // ✅ biar Swagger tetap cepat
  });

  return orders.map((order, index) => {
    const totalItem = order.items.reduce((t, i) => t + i.quantity, 0);
    const totalPrice = order.items.reduce(
      (t, i) => t + i.quantity * (i.product?.price ?? 0),
      0,
    );

    // ✅ Format kode transaksi
    const created = new Date(order.createdAt);
    const trxCode = `TRX${created.getFullYear()}${String(created.getMonth() + 1).padStart(2, '0')}${String(created.getDate()).padStart(2, '0')}${String(order.id).padStart(4, '0')}`;

    return {
      no: index + 1, // ✅ nomor urut di table
      transactionId: trxCode,
      createdAt: order.createdAt,
      cashierName: order.user.username,
      totalItem,
      totalPrice,
      paymentMethod: order.paymentMethod,
      actionId: order.id, // ✅ untuk tombol "Detail"
    };
  });
}





  async updateOrderStatus(id: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  // --- USER MANAGEMENT ---
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

  // --- STATISTIK ---

async getStats(type: StatsType, years: number[]) {
  // ✅ Tentukan tipe data result
  const result: {
    year: number;
    totalYear: number;
    months: { month: number; value: number }[];
  }[] = [];

  for (const year of years) {
    const months: { month: number; value: number }[] = []; // ✅ Fix type
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
      }

      else if (type === StatsType.TRANSACTIONS) {
        value = await this.prisma.order.count({
          where: { createdAt: { gte: start, lt: end } },
        });
      }

      else if (type === StatsType.ITEMS_SOLD) {
        const agg = await this.prisma.orderItem.aggregate({
          where: { order: { createdAt: { gte: start, lt: end } } },
          _sum: { quantity: true },
        });
        value = agg._sum.quantity ?? 0;
      }

      months.push({ month, value });
      totalYear += value;
    }

    result.push({
      year,
      totalYear,
      months,
    });
  }

  return {
    type,
    years: result,
  };
}






  // --- DASHBOARD STATISTIK (Pisah per fungsi) ---

async dashboardStatsByYear(year: number) {
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year + 1}-01-01`);

  // Total Item Terjual
  const totalItem = await this.prisma.orderItem.aggregate({
    _sum: { quantity: true },
    where: {
      order: { status: 'COMPLETED', createdAt: { gte: start, lt: end } },
    },
  });

  // Total Transaksi
  const totalTransaksi = await this.prisma.order.count({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: start, lt: end },
    },
  });

  // Total Pemasukan
  const totalPemasukan = await this.prisma.order.aggregate({
    _sum: { total: true },
    where: {
      status: 'COMPLETED',
      createdAt: { gte: start, lt: end },
    },
  });

  // Total Pelanggan Baru
  const totalPelanggan = await this.prisma.user.count({
    where: {
      role: 'PELANGGAN',
      createdAt: { gte: start, lt: end },
    },
  });

  // Statistik metode pembayaran
  const paymentStats = await this.prisma.order.groupBy({
    by: ['paymentMethod'],
    _count: { paymentMethod: true },
    where: {
      createdAt: { gte: start, lt: end },
      status: 'COMPLETED',
    },
  });

  const paymentMethodStats = paymentStats.map((item) => ({
    method: item.paymentMethod,
    count: item._count.paymentMethod,
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

  // --- LEADERBOARD PRODUK TERLARIS ---
async topProductsLeaderboard() {
  // ✅ Ambil top produk groupBy
  const top = await this.prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  });

  if (!top.length) return [];

  // ✅ Hitung total semua produk untuk persentase
  const totalAgg = await this.prisma.orderItem.aggregate({
    _sum: { quantity: true },
  });
  const totalAll = totalAgg._sum.quantity ?? 0;

  // ✅ Ambil info produk
  const products = await this.prisma.product.findMany({
    where: { id: { in: top.map(t => t.productId) } },
    select: {
      id: true,
      name: true,
      price: true,
    },
  });

  const map = new Map(products.map(p => [p.id, p]));

  return top.map((item, index) => {
    const product = map.get(item.productId);
    const sold = item._sum.quantity ?? 0;
    const totalPrice = sold * (product?.price ?? 0);

    const percentage =
      totalAll > 0 ? Number(((sold / totalAll) * 100).toFixed(2)) : 0;

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



}
