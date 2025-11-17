import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatepesananPelangganDto } from './dto/create-pesanan-pelanggan.dto';
import { randomBytes } from 'crypto';
import * as bwipjs from 'bwip-js';
import { OrderStatus } from '../../generated/prisma';

@Injectable()
export class PelangganService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // ✔ Ambil semua produk yang masih ada stok
  // ============================================
  async getProducts() {
    return this.prisma.product.findMany({
      where: { stock: { gt: 0 } },
      include: {
        units: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // ============================================
  // ✔ Pelanggan membuat pesanan baru
  // ============================================
  async createOrder(dto: CreatepesananPelangganDto) {
    const barcode = randomBytes(4).toString('hex').toUpperCase();

    let total = 0;
    const orderItems: any[] = []; // FIX ERROR NEVER[]

    for (const item of dto.items) {
      // 1. Cari produk
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Produk dengan ID ${item.productId} tidak ditemukan`,
        );
      }

      // 2. Cari satuan produk (Dus / Pack / Pcs)
      const unit = await this.prisma.productUnit.findUnique({
        where: { id: item.unitId },
      });

      if (!unit || unit.productId !== product.id) {
        throw new NotFoundException(`Satuan produk tidak valid`);
      }

      // 3. Cek stok berdasarkan multiplier
      const realStockNeeded = unit.multiplier * item.quantity;

      if (product.stock < realStockNeeded) {
        throw new BadRequestException(
          `${product.name} stok tidak cukup. Dibutuhkan ${realStockNeeded}, tersedia ${product.stock}`,
        );
      }

      // 4. Harga & Diskon
      const originalPrice = unit.price;
      let discountValue = 0;

      if (item.discountPercent) {
        discountValue = (originalPrice * item.discountPercent) / 100;
      }

      if (item.discountValue) {
        discountValue = item.discountValue;
      }

      const finalPrice = originalPrice - discountValue;
      const subtotal = finalPrice * item.quantity;

      total += subtotal;

      // 5. Push item lengkap (WAJIB sesuai Prisma)
      orderItems.push({
        productId: product.id,
        unitId: unit.id,
        quantity: item.quantity,
        unitPrice: originalPrice,
        unitMultiplier: unit.multiplier,
        discountPercent: item.discountPercent ?? 0,
        discountValue: discountValue,
        subtotal,
      });

      // 6. Kurangi stok
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          stock: product.stock - realStockNeeded,
        },
      });
    }

    // 7. Simpan order + item
    const order = await this.prisma.order.create({
      data: {
        userId: 1, // sementara
        total,
        status: OrderStatus.PENDING,
        barcode,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            unit: true,
          },
        },
      },
    });

    // 8. Generate Barcode Image
    const barcodeImage = await this.generateBarcodeImage(barcode);

    return {
      message: 'Pesanan berhasil dibuat',
      barcode,
      barcodeImage,
      totalPrice: total,
      order,
    };
  }

  // ============================================
  // ✔ Generate barcode PNG base64
  // ============================================
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

  // ============================================
  // ✔ Cari pesanan berdasarkan barcode
  // ============================================
  async getOrderByBarcode(barcode: string) {
    const order = await this.prisma.order.findUnique({
      where: { barcode },
      include: {
        items: {
          include: {
            product: true,
            unit: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    return order;
  }
}
