import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FilterReportDto } from './dto/filter-report.dto';
import { Prisma, OrderStatus, PaymentMethod } from '../../../../generated/prisma';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  // ==============================================
  // UTIL: Convert BigInt → Number
  // ==============================================
  private toNumber(data: any) {
    if (data === null || data === undefined) return data;
    if (typeof data === 'bigint') return Number(data);
    if (Array.isArray(data)) return data.map(v => this.toNumber(v));
    if (typeof data === 'object') {
      Object.keys(data).forEach(k => {
        data[k] = this.toNumber(data[k]);
      });
      return data;
    }
    return data;
  }

  // Build where
private buildWhere(dto: FilterReportDto): Prisma.OrderWhereInput {
  return {
    createdAt: {
      gte: dto.from ? new Date(dto.from) : undefined,
      lte: dto.to ? new Date(dto.to + 'T23:59:59') : undefined,
    },
    userId: dto.cashierId ? Number(dto.cashierId) : undefined,
    paymentMethod: dto.paymentMethod
      ? (dto.paymentMethod as PaymentMethod)
      : undefined,
    status: OrderStatus.COMPLETED,
  };
}


  // ==============================================
  // 1. SUMMARY
  // ==============================================
  async getSummary(dto: FilterReportDto) {
    const where = this.buildWhere(dto);

    const orders = await this.prisma.order.findMany({ where });

    const totalTransaksi = orders.length;
    const totalKotor = orders.reduce((a, o) => a + o.subtotal, 0);
    const totalDiskon = orders.reduce((a, o) => a + o.discountValue, 0);
    const totalTax = orders.reduce((a, o) => a + o.taxValue, 0);
    const totalBersih = orders.reduce((a, o) => a + o.total, 0);

    return {
      totalTransaksi,
      totalPenjualanKotor: totalKotor,
      totalDiskon,
      totalPajak: totalTax,
      totalPenjualanBersih: totalBersih,
      pelangganUnik: 0, // belum ada customer
      waktuRataRataTransaksi: '00:00:00',
    };
  }

  // ==============================================
  // 2. DAILY CHART
  // ==============================================
  async getDailyChart(dto: FilterReportDto) {
    const where = this.buildWhere(dto);

    const start = dto.from ? new Date(dto.from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = dto.to ? new Date(dto.to + 'T23:59:59') : new Date();

    const raw = await this.prisma.$queryRawUnsafe<any>(`
      SELECT DATE(createdAt) AS tanggal, SUM(total) AS total
      FROM \`Order\`
      WHERE status='COMPLETED'
      AND createdAt BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'
      GROUP BY DATE(createdAt)
      ORDER BY tanggal ASC
    `);

    return this.toNumber(raw);
  }

  // ==============================================
  // 3. PAYMENT METHOD (PIE CHART)
  // ==============================================
  async getPaymentStats(dto: FilterReportDto) {
    const where = this.buildWhere(dto);

    const raw = await this.prisma.$queryRawUnsafe<any>(`
      SELECT paymentMethod, COUNT(*) AS total
      FROM \`Order\`
      WHERE status='COMPLETED'
      GROUP BY paymentMethod
    `);

    return this.toNumber(raw);
  }

  // ==============================================
  // 4. TABEL TRANSAKSI
  // ==============================================
  async getTransactions(dto: FilterReportDto, page = 1, limit = 10) {
    const where = this.buildWhere(dto);

    if (dto.search && dto.search.trim() !== '') {
  const s = dto.search.trim();

  // buat OR condition yang pasti bertipe Prisma.OrderWhereInput[]
  const orConditions: Prisma.OrderWhereInput[] = [
    { barcode: { contains: s } },
  ];

  const maybeId = Number(s);
  if (!isNaN(maybeId)) {
    orConditions.push({ id: maybeId });
  }

  // pastikan AND selalu berupa array
  const andConditions: Prisma.OrderWhereInput[] = [];

  if (where.AND) {
    if (Array.isArray(where.AND)) andConditions.push(...where.AND);
    else andConditions.push(where.AND);
  }

  andConditions.push({ OR: orConditions });
  where.AND = andConditions;
}


    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: true,
          items: { include: { product: true, unit: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==============================================
  // 5. Penjualan per Produk
  // ==============================================
  async getSalesPerProduct(dto: FilterReportDto) {
    const raw = await this.prisma.$queryRawUnsafe<any>(`
      SELECT 
        p.name AS productName,
        c.name AS categoryName,
        SUM(oi.quantity) AS qty,
        SUM(oi.subtotal) AS totalPenjualan,
        SUM(oi.discountValue) AS totalDiskon
      FROM OrderItem oi
      JOIN Product p ON oi.productId = p.id
      LEFT JOIN Category c ON p.categoryId = c.id
      JOIN \`Order\` o ON o.id = oi.orderId
      WHERE o.status='COMPLETED'
      GROUP BY oi.productId
      ORDER BY qty DESC
    `);

    return this.toNumber(raw);
  }

  // ==============================================
  // 6. Ringkasan per Kasir
  // ==============================================
  async getSalesPerCashier(dto: FilterReportDto) {
    const raw = await this.prisma.$queryRawUnsafe<any>(`
      SELECT 
        u.name AS kasir,
        COUNT(o.id) AS jumlahTransaksi,
        SUM(o.total) AS totalPenjualan
      FROM \`Order\` o
      JOIN User u ON o.userId = u.id
      WHERE o.status='COMPLETED'
      GROUP BY u.id
      ORDER BY jumlahTransaksi DESC
    `);

    return this.toNumber(raw);
  }

  // ==============================================
  // 7. Ringkasan per Kategori
  // ==============================================
  async getSalesPerCategory(dto: FilterReportDto) {
    const raw = await this.prisma.$queryRawUnsafe<any>(`
      SELECT 
        c.name AS kategori,
        SUM(oi.quantity) AS qty,
        SUM(oi.subtotal) AS totalPenjualan
      FROM OrderItem oi
      JOIN Product p ON oi.productId = p.id
      LEFT JOIN Category c ON p.categoryId = c.id
      JOIN \`Order\` o ON o.id = oi.orderId
      WHERE o.status='COMPLETED'
      GROUP BY c.id
      ORDER BY qty DESC
    `);

    return this.toNumber(raw);
  }

  // ==============================================
  // 8. Grafik Tahunan
  // ==============================================
  async getYearlySales() {
    const raw = await this.prisma.$queryRawUnsafe<any>(`
      SELECT YEAR(createdAt) AS tahun, SUM(total) AS total
      FROM \`Order\`
      WHERE status='COMPLETED'
      GROUP BY YEAR(createdAt)
      ORDER BY tahun ASC
    `);

    return this.toNumber(raw);
  }
}
