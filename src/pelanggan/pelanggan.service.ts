import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatepesananPelangganDto } from './dto/create-pesanan-pelanggan.dto';
import { randomBytes } from 'crypto';
import * as bwipjs from 'bwip-js';
import { OrderStatus } from '../../generated/prisma'; // Enum dari Prisma

@Injectable()
export class PelangganService {
  constructor(private prisma: PrismaService) {}

  // ✅ Ambil semua produk yang masih ada stok
  async getProducts() {
    return this.prisma.product.findMany({
      where: { stock: { gt: 0 } },
      orderBy: { name: 'asc' },
    });
  }

  // ✅ Pelanggan membuat pesanan baru
  async createOrder(dto: CreatepesananPelangganDto) {
    // Generate barcode unik
    const barcode = randomBytes(4).toString('hex').toUpperCase();

    // Ambil produk berdasarkan ID yang dikirim
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length === 0) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    // Hitung total dan siapkan item pesanan
    let total = 0;
    const orderItems = dto.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        throw new NotFoundException(`Produk dengan ID ${item.productId} tidak ditemukan`);
      }

      const subtotal = prod.price * item.quantity;
      total += subtotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        subtotal,
      };
    });

    // Simpan ke tabel Order & OrderItem
    const order = await this.prisma.order.create({
      data: {
        userId: 1, // sementara hardcoded (bisa diganti req.user.id kalau login)
        total,
        status: OrderStatus.PENDING,
        barcode,
        items: {
          create: orderItems,
        },
      },
      include: { items: { include: { product: true } } },
    });

    // ✅ Buat gambar barcode (base64 PNG)
    const barcodeImage = await this.generateBarcodeImage(barcode);

    return {
      message: 'Pesanan berhasil dibuat',
      barcode,
      barcodeImage,
      totalPrice: total,
      order,
    };
  }

  // ✅ Generate gambar barcode (base64)
  async generateBarcodeImage(code: string): Promise<string> {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: code,
      scale: 4,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });
    return 'data:image/png;base64,' + png.toString('base64');
  }

  // ✅ Lihat pesanan pelanggan berdasarkan barcode
  async getOrderByBarcode(barcode: string) {
    const order = await this.prisma.order.findUnique({
      where: { barcode },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    return order;
  }
}
