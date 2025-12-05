import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FilterReportDto } from './dto/filter-report.dto';
import { Prisma, OrderStatus, PaymentMethod } from '../../../../generated/prisma';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  // Convert bigints / decimals → number
  private toNumber(data: any) {
    if (data === null || data === undefined) return data;
    if (typeof data === 'bigint') return Number(data);
    if (Array.isArray(data)) return data.map(v => this.toNumber(v));
    if (typeof data === 'object') {
      Object.keys(data).forEach(k => (data[k] = this.toNumber(data[k])));
      return data;
    }
    return data;
  }

  // Build prisma where()
  private buildWhere(dto: FilterReportDto): Prisma.OrderWhereInput {
    return {
      status: OrderStatus.COMPLETED,

      createdAt: {
        gte: dto.from ? new Date(dto.from) : undefined,
        lte: dto.to ? new Date(dto.to + 'T23:59:59') : undefined,
      },

      userId: dto.cashierId ? Number(dto.cashierId) : undefined,

      paymentMethod: dto.paymentMethod
        ? (dto.paymentMethod as PaymentMethod)
        : undefined,
    };
  }

  // Build raw filter for SQL
  private buildRaw(dto: FilterReportDto, alias = 'o'): string {
    const c = [`${alias}.status='COMPLETED'`];

    if (dto.from) c.push(`${alias}.createdAt >= '${new Date(dto.from).toISOString()}'`);
    if (dto.to)
      c.push(
        `${alias}.createdAt <= '${new Date(dto.to + 'T23:59:59').toISOString()}'`,
      );

    if (dto.cashierId) c.push(`${alias}.userId = ${Number(dto.cashierId)}`);

    if (dto.paymentMethod)
      c.push(`${alias}.paymentMethod='${dto.paymentMethod}'`);

    return `WHERE ${c.join(' AND ')}`;
  }

  // ===========================
  // 1. SUMMARY
  // ===========================
  async getSummary(dto: FilterReportDto) {
    const where = this.buildWhere(dto);

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        subtotal: true,
        discountValue: true,
        taxValue: true,
        total: true,
        customerId: true,
        durationSeconds: true,
      },
    });

    const totalTransaksi = orders.length;

    const totalKotor = orders.reduce((a, o) => a + Number(o.subtotal ?? 0), 0);
    const totalDiskon = orders.reduce((a, o) => a + Number(o.discountValue ?? 0), 0);
    const totalPajak = orders.reduce((a, o) => a + Number(o.taxValue ?? 0), 0);
    const totalBersih = orders.reduce((a, o) => a + Number(o.total ?? 0), 0);

    // pelanggan unik
    const pelangganUnik = new Set(
      orders.filter(o => o.customerId !== null).map(o => o.customerId),
    ).size;

    // rata-rata durasi
    const durations = orders.map(o => Number(o.durationSeconds ?? 0)).filter(v => v > 0);
    const avg = durations.length
      ? Math.floor(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const waktuRataRataTransaksi = this.toHMS(avg);

    return {
      totalTransaksi,
      totalPenjualanKotor: totalKotor,
      totalDiskon,
      totalPajak,
      totalPenjualanBersih: totalBersih,
      pelangganUnik,
      waktuRataRataTransaksi,
    };
  }

  private toHMS(sec: number) {
    const h = Math.floor(sec / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  // ===========================
  // 2. DAILY CHART (30 days)
  // ===========================
  async getDailyChart(dto: FilterReportDto) {
    const now = new Date();
    const end = dto.to ? new Date(dto.to + 'T23:59:59') : now;

    const start = dto.from
      ? new Date(dto.from)
      : new Date(end.getTime() - 29 * 24 * 3600 * 1000);

    const where = this.buildRaw(dto, 'o');

    const raw = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT DATE(o.createdAt) AS tanggal, SUM(o.total) AS total
      FROM \`Order\` o
      ${where}
      GROUP BY DATE(o.createdAt)
      ORDER BY tanggal ASC
    `);

    const map = new Map<string, number>();
raw.forEach(r => map.set(r.tanggal, Number(r.total)));

const result: { tanggal: string; total: number }[] = [];

const d = new Date(start);

while (d <= end) {
  const key = d.toISOString().split('T')[0];

  result.push({
    tanggal: key,
    total: map.get(key) ?? 0,
  });

  d.setDate(d.getDate() + 1);
}

return result;
  }

    // ===========================
  // 3. PAYMENT METHOD (PIE CHART)
  // ===========================
  async getPaymentStats(dto: FilterReportDto) {
    const where = this.buildRaw(dto, 'o');

    const raw = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        o.paymentMethod AS metode,
        COUNT(o.id) AS jumlahTransaksi,
        SUM(o.total) AS totalNominal
      FROM \`Order\` o
      ${where}
      GROUP BY o.paymentMethod
      ORDER BY jumlahTransaksi DESC
    `);

    return this.toNumber(raw);
  }

    // ===========================
  // 4. TABEL TRANSAKSI
  // ===========================
  async getTransactions(dto: FilterReportDto, page = 1, limit = 10) {
    const where: Prisma.OrderWhereInput = this.buildWhere(dto);

    // SEARCH
    if (dto.search && dto.search.trim() !== '') {
      const s = dto.search.trim();

      const OR: Prisma.OrderWhereInput[] = [
        { barcode: { contains: s } }
      ];

      const id = Number(s);
      if (!isNaN(id)) OR.push({ id });

      where.AND = where.AND ? [...(where.AND as any[]), { OR }] : [{ OR }];
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: true,
          customer: true,
          items: {
            include: { product: true, unit: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.order.count({ where }),
    ]);

    const finalData = data.map(o => ({
      id: o.id,
      tanggal: o.createdAt,
      kasir: o.user?.name ?? '-',
      pelanggan: o.customer?.name ?? '-',
      metodePembayaran: o.paymentMethod,
      subtotal: Number(o.subtotal ?? 0),
      diskon: Number(o.discountValue ?? 0),
      pajak: Number(o.taxValue ?? 0),
      total: Number(o.total ?? 0),
    }));

    return {
      data: finalData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

    // ===========================
  // 5. PENJUALAN PER PRODUK
  // ===========================
  async getSalesPerProduct(dto: FilterReportDto) {
    const where = this.buildRaw(dto, 'o');

    const raw = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        p.name AS productName,
        c.name AS categoryName,
        SUM(oi.quantity) AS qty,
        SUM(oi.subtotal) AS totalPenjualan,
        SUM(oi.discountValue) AS totalDiskon
      FROM OrderItem oi
      JOIN Product p ON oi.productId = p.id
      LEFT JOIN Category c ON p.categoryId = c.id
      JOIN \`Order\` o ON oi.orderId = o.id
      ${where}
      GROUP BY oi.productId
      ORDER BY qty DESC
    `);

    return this.toNumber(raw);
  }

    // ===========================
  // 6. RINGKASAN PER KASIR
  // ===========================
  async getSalesPerCashier(dto: FilterReportDto) {
    const where = this.buildRaw(dto, 'o');

    const raw = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        u.name AS kasir,
        COUNT(o.id) AS jumlahTransaksi,
        SUM(o.total) AS totalPenjualan,
        (SUM(o.total) / COUNT(o.id)) AS rataRataTransaksi
      FROM \`Order\` o
      JOIN User u ON o.userId = u.id
      ${where}
      GROUP BY u.id
      ORDER BY jumlahTransaksi DESC
    `);

    return this.toNumber(raw);
  }

    // ===========================
  // 7. RINGKASAN PER KATEGORI
  // ===========================
  async getSalesPerCategory(dto: FilterReportDto) {
    const where = this.buildRaw(dto, 'o');

    const raw = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        c.name AS kategori,
        SUM(oi.quantity) AS qty,
        SUM(oi.subtotal) AS totalPenjualan
      FROM OrderItem oi
      JOIN Product p ON oi.productId = p.id
      LEFT JOIN Category c ON p.categoryId = c.id
      JOIN \`Order\` o ON oi.orderId = o.id
      ${where}
      GROUP BY c.id
      ORDER BY qty DESC
    `);

    return this.toNumber(raw);
  }

    // ===========================
  // 8. GRAFIK PENJUALAN TAHUNAN
  // ===========================
  async getYearlySales() {
    const raw = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        YEAR(createdAt) AS tahun, 
        SUM(total) AS total
      FROM \`Order\`
      WHERE status='COMPLETED'
      GROUP BY YEAR(createdAt)
      ORDER BY tahun ASC
    `);

    return this.toNumber(raw);
  }
}



