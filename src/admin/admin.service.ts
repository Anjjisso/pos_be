import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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
    return this.prisma.order.findMany({
      include: { user: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
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
  async topProductsByYear(year: number) {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year + 1}-01-01`);

    const result = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        order: {
          createdAt: { gte: start, lt: end },
        },
      },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: 5,
    });

    return this.attachProductNames(result);
  }

  async topProductsByMonth(year: number, month: number) {
    const start = new Date(`${year}-${String(month).padStart(2, '0')}-01`);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);

    const result = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        order: {
          createdAt: { gte: start, lt: end },
        },
      },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: 5,
    });

    return this.attachProductNames(result);
  }

  async topProductsByWeek(year: number, month: number, week: number) {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const start = new Date(firstDayOfMonth);
    start.setDate(firstDayOfMonth.getDate() + (week - 1) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const result = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        order: {
          createdAt: { gte: start, lt: end },
        },
      },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: 5,
    });

    return this.attachProductNames(result);
  }

  // --- Helper ---
  private async attachProductNames(result: any[]) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: result.map(r => r.productId) } },
      select: { id: true, name: true },
    });

    return result.map(r => ({
      productId: r.productId,
      productName: products.find(p => p.id === r.productId)?.name || 'Unknown',
      totalSold: r._sum.quantity,
    }));
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

}
